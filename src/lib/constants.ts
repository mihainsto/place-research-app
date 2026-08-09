/**
 * Vocabulary + palette.
 *
 * Status and category colours are defined HERE and nowhere else — they are
 * always applied from JS (tags, status hairlines, the graph canvas painter),
 * so keeping a second copy in CSS would only create drift.
 * Surface / ink / accent tokens live in `src/styles/theme.css`.
 */

export const STATUSES = [
  'Idea',
  'Script',
  'Ready to Film',
  'Filmed',
  'Editing',
  'Posted',
] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['Must Film', 'Good', 'Maybe'] as const
export type Priority = (typeof PRIORITIES)[number]

/** Suggested categories. Any other string is accepted and rendered neutrally. */
export const KNOWN_CATEGORIES = [
  'Weird China',
  'Skyscraper View',
  'Food',
  'Urban',
  'Architecture',
  'Travel',
  'Culture',
  'Adventure',
  'WTF',
  'Hidden Gem',
] as const

export const REFERENCE_TYPES = [
  'instagram',
  'tiktok',
  'youtube',
  'xiaohongshu',
  'article',
  'video',
  'website',
] as const
export type ReferenceType = (typeof REFERENCE_TYPES)[number]

// --- Palette ---------------------------------------------------------------

export const ACCENT = '#e0483d'
export const INK = '#f2f2f5'
export const INK_2 = '#9b9ba3'
export const INK_3 = '#6b6b73'
export const CANVAS = '#08090a'
export const SURFACE = '#0f1012'

export const STATUS_COLOR: Record<Status, string> = {
  Idea: '#6b6b73',
  Script: '#7b8aa3',
  'Ready to Film': '#c9a227',
  Filmed: '#4f9e76',
  Editing: '#8a7bb0',
  Posted: '#e0483d',
}

const CATEGORY_COLOR: Record<string, string> = {
  'weird china': '#c98fd6',
  'skyscraper view': '#9aa6e0',
  food: '#d9974e',
  urban: '#7fa8d1',
  architecture: '#8fbfae',
  travel: '#7fb3a3',
  culture: '#cf8f8f',
  adventure: '#9fbf6f',
  wtf: '#d97a8f',
  'hidden gem': '#b7a06a',
}

const CATEGORY_FALLBACK = '#8b8b93'

/** Unknown categories never break — they render in a neutral tone. */
export function categoryColor(category: string | undefined): string {
  if (!category) return CATEGORY_FALLBACK
  return CATEGORY_COLOR[category.trim().toLowerCase()] ?? CATEGORY_FALLBACK
}

/** Sort weight for the default Wall ordering: Must Film first. */
export const PRIORITY_RANK: Record<Priority, number> = {
  'Must Film': 0,
  Good: 1,
  Maybe: 2,
}

export const STATUS_RANK: Record<Status, number> = {
  Idea: 0,
  Script: 1,
  'Ready to Film': 2,
  Filmed: 3,
  Editing: 4,
  Posted: 5,
}
