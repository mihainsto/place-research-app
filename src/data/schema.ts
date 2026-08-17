import { z } from 'zod'
import { PRIORITIES, REFERENCE_TYPES, STATUSES } from '@/lib/constants'
import type { Priority, ReferenceType, Status } from '@/lib/constants'

/**
 * THE CONTRACT between the LLM and the app.
 *
 * Two layers, deliberately:
 *
 *   Raw*    — permissive. Accepts what an LLM plausibly writes. Its only job
 *             is to guarantee the *shape* is safe to work with, so that one
 *             malformed entry can never take down the app.
 *   TikTok  — canonical. What every component consumes. Produced by
 *             `normalize.ts`, which fills defaults and derives what it can.
 *
 * Rule of thumb: every field the LLM doesn't have to get right is a field it
 * can't get wrong. So almost everything here is optional, and `normalize.ts`
 * does the real work.
 */

// --- Raw (what may appear in the JSON file) --------------------------------

export const RawReferenceSchema = z.object({
  title: z.string().optional(),
  url: z.string(),
  type: z.string().optional(),
})

export const RawLocationSchema = z.object({
  name: z.string().optional(),
  appleMapsUrl: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  amapUrl: z.string().optional(),
})

export const RawTikTokSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'title is required and must be a non-empty string'),
  cityId: z.string().optional(),
  /** Tolerated alias: LLMs naturally write `"city": "Chongqing"`. */
  city: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  coverImage: z.string().optional(),
  location: RawLocationSchema.optional(),
  /** Parsed per-item downstream so one bad reference can't drop the TikTok. */
  references: z.array(z.unknown()).optional(),
  script: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export const RawCitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  region: z.string().optional(),
  coverImage: z.string().optional(),
})

export const RawTimelineDaySchema = z.object({
  date: z.string(),
  cityId: z.string().optional(),
  /** Same tolerated alias as on a TikTok. */
  city: z.string().optional(),
  note: z.string().optional(),
  train: z
    .object({
      departure: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
      durationMinutes: z.number().int().positive(),
    })
    .optional(),
})

export const RawDatasetSchema = z.object({
  $schema: z.string().optional(),
  project: z
    .object({
      name: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .optional(),
  cities: z.array(z.unknown()).optional(),
  tiktoks: z.array(z.unknown()),
  /** One entry per day of the trip. Optional — no timeline is a valid state. */
  timeline: z.array(z.unknown()).optional(),
})

export type RawTikTok = z.infer<typeof RawTikTokSchema>
export type RawCity = z.infer<typeof RawCitySchema>

/** Used to flag likely typos (`categoy`, `pirority`) without rejecting data. */
export const KNOWN_TIKTOK_KEYS: ReadonlySet<string> = new Set([
  'id',
  'title',
  'cityId',
  'city',
  'status',
  'priority',
  'category',
  'coverImage',
  'location',
  'references',
  'script',
  'createdAt',
  'updatedAt',
])

export const KNOWN_LOCATION_KEYS: ReadonlySet<string> = new Set([
  'name',
  'appleMapsUrl',
  'googleMapsUrl',
  'amapUrl',
])

export const KNOWN_TIMELINE_KEYS: ReadonlySet<string> = new Set([
  'date',
  'cityId',
  'city',
  'note',
  'train',
])

// --- Authoring (what the LLM should aim for) -------------------------------

/**
 * The *strict* schema. Nothing at runtime uses it — its two jobs are:
 *   1. generate `schema/china-2026.schema.json`, which the LLM is given, and
 *   2. power `npm run validate`, so you can catch sloppy output before you
 *      commit it.
 *
 * Runtime parsing stays permissive (Raw* above). This pair is deliberate:
 * strict where a human can fix it, forgiving where a user is standing in the
 * street trying to read a script.
 */

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const AuthoringReferenceSchema = z
  .object({
    title: z.string().min(1).describe('Human label, e.g. "The reel that started this idea".'),
    url: z.url().describe('Absolute http(s) URL.'),
    type: z
      .enum(REFERENCE_TYPES)
      .optional()
      .describe('Optional. Derived from the URL when omitted.'),
  })
  .describe('A source: a reel, a video, an article, a website.')

export const AuthoringLocationSchema = z
  .object({
    name: z.string().min(1).describe('Where to physically stand, specific enough to navigate to.'),
    appleMapsUrl: z.url().optional().describe('Optional. Derived from name + city when omitted.'),
    googleMapsUrl: z.url().optional().describe('Optional. Derived from name + city when omitted.'),
    amapUrl: z
      .url()
      .optional()
      .describe('Optional 高德地图 link. Worth adding — Google Maps does not work in mainland China.'),
  })
  .describe('Where this gets filmed.')

export const AuthoringTikTokSchema = z.object({
  id: z
    .string()
    .regex(kebab, 'id must be kebab-case: lowercase letters, digits and single hyphens')
    .describe('Permanent kebab-case id. This is the URL. NEVER change it once assigned.'),
  title: z.string().min(1).describe('The TikTok title, as it would be said out loud.'),
  cityId: z.string().regex(kebab).describe('kebab-case id of a city in `cities`.'),
  status: z.enum(STATUSES).describe('Production status.'),
  priority: z.enum(PRIORITIES).describe('How much this matters.'),
  category: z.string().min(1).describe('A simple string, e.g. "Weird China", "Food", "Urban".'),
  coverImage: z
    .string()
    .optional()
    .describe('Absolute URL, or a repo-relative path like "/covers/foo.jpg".'),
  location: AuthoringLocationSchema.optional(),
  references: z.array(AuthoringReferenceSchema).optional(),
  script: z
    .string()
    .optional()
    .describe(
      'The single content field. Markdown. Hook, beats, shot notes, voiceover, caption ideas — everything goes here. There are no other content fields.',
    ),
  createdAt: z.string().optional().describe('ISO date, e.g. "2026-08-09".'),
  updatedAt: z.string().optional().describe('ISO date.'),
})

export const AuthoringCitySchema = z.object({
  id: z.string().regex(kebab).describe('kebab-case id, e.g. "chongqing".'),
  name: z.string().min(1).describe('Display name, e.g. "Chongqing".'),
  region: z.string().optional().describe('Optional, e.g. "Southwest".'),
  coverImage: z.string().optional(),
})

export const AuthoringTimelineDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be ISO, e.g. "2026-09-12"')
    .describe('ISO date. One entry per day of the trip. The weekday is derived — never store it.'),
  cityId: z.string().regex(kebab).describe('kebab-case id of a city in `cities`.'),
  note: z.string().optional().describe('Optional one-liner for the day — a flight, a booking, a plan.'),
  train: z
    .object({
      departure: z
        .string()
        .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
        .describe('Local departure time in 24-hour HH:MM format.'),
      durationMinutes: z
        .number()
        .int()
        .positive()
        .describe('Expected train duration in minutes.'),
    })
    .optional()
    .describe('Optional train travel block. The timeline calculates and displays the arrival time.'),
})

export const AuthoringDatasetSchema = z
  .object({
    $schema: z.string().optional(),
    project: z
      .object({
        name: z.string().optional(),
        updatedAt: z.string().optional(),
      })
      .optional(),
    cities: z.array(AuthoringCitySchema),
    tiktoks: z.array(AuthoringTikTokSchema),
    timeline: z
      .array(AuthoringTimelineDaySchema)
      .optional()
      .describe('The trip, one entry per day. Optional — an empty plan is a valid state.'),
  })
  .describe('China 2026 — TikTok command center dataset.')

// --- Canonical (what the app renders) --------------------------------------

export interface Reference {
  /** Stable per-TikTok, used as a React key and a graph node id. */
  id: string
  title: string
  url: string
  type: ReferenceType
  /** Display hostname, e.g. `instagram.com`. Empty for unparseable URLs. */
  hostname: string
}

export interface MapLink {
  label: 'Apple Maps' | 'Google Maps' | 'Amap 高德'
  url: string
  /** True when we synthesised a search URL from the location name. */
  derived: boolean
}

export interface Location {
  name: string
  links: MapLink[]
}

export interface TikTok {
  id: string
  title: string
  cityId: string
  status: Status
  priority: Priority
  category: string
  coverImage: string | null
  location: Location | null
  references: Reference[]
  script: string
  createdAt: string | null
  updatedAt: string | null
  /** Lowercased haystack for search. Built once at load. */
  searchText: string
}

export interface TimelineDay {
  /** ISO `YYYY-MM-DD`. The weekday is always derived from this, never stored. */
  date: string
  cityId: string
  note: string
  train: TrainSchedule | null
}

export interface TrainSchedule {
  departure: string
  durationMinutes: number
}

export interface City {
  id: string
  name: string
  region: string | null
  coverImage: string | null
  /** True when the city was inferred from a TikTok rather than declared. */
  derived: boolean
}

export type IssueLevel = 'error' | 'warning'

export interface DataIssue {
  level: IssueLevel
  /** Where the problem is, e.g. `tiktoks[3]` or `tiktoks[3].references[1]`. */
  path: string
  /** Best-effort human label so you can find the entry in the JSON. */
  subject: string
  message: string
}

export interface Dataset {
  projectName: string
  updatedAt: string | null
  tiktoks: TikTok[]
  cities: City[]
  /** Sorted by date. Empty when no trip has been planned yet. */
  timeline: TimelineDay[]
  issues: DataIssue[]
}
