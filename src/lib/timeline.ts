import type { TimelineDay } from '@/data/schema'

/**
 * The trip, grouped.
 *
 * Nine near-identical day rows read as a spreadsheet. Consecutive days in the
 * same city are the unit you actually plan in — "three days in Chongqing" —
 * so the timeline is built out of legs, not days.
 *
 * Dates are handled in UTC throughout. They're calendar days, not instants,
 * and parsing `2026-09-12` in a local timezone west of UTC would render it as
 * the 11th.
 */

export interface Leg {
  cityId: string
  days: TimelineDay[]
}

export function buildLegs(timeline: TimelineDay[]): Leg[] {
  const legs: Leg[] = []
  for (const day of timeline) {
    const current = legs[legs.length - 1]
    if (current && current.cityId === day.cityId && isNextDay(current.days[current.days.length - 1].date, day.date)) {
      current.days.push(day)
    } else {
      legs.push({ cityId: day.cityId, days: [day] })
    }
  }
  return legs
}

/** A gap in the dates starts a new leg — you went somewhere and came back. */
function isNextDay(previous: string, next: string): boolean {
  const a = Date.parse(`${previous}T00:00:00Z`)
  const b = Date.parse(`${next}T00:00:00Z`)
  return b - a === 86_400_000
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`)

export function weekday(iso: string, length: 'short' | 'long' = 'short'): string {
  return utc(iso).toLocaleDateString('en-GB', { weekday: length, timeZone: 'UTC' })
}

export function dayOfMonth(iso: string): string {
  return utc(iso).toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'UTC' })
}

export function monthShort(iso: string): string {
  return utc(iso).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
}

/** "12–20 September 2026", or "12 September 2026" for a single day. */
export function formatSpan(first: string, last: string): string {
  const a = utc(first)
  const b = utc(last)
  const monthYear = b.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  if (first === last) {
    return `${dayOfMonth(first)} ${monthYear}`
  }
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) {
    return `${dayOfMonth(first)}–${dayOfMonth(last)} ${monthYear}`
  }
  return `${dayOfMonth(first)} ${monthShort(first)} – ${dayOfMonth(last)} ${monthYear}`
}
