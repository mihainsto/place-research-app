import type { TikTok } from '@/data/schema'
import { PRIORITY_RANK, STATUS_RANK, type Priority, type Status } from '@/lib/constants'

export const SORT_KEYS = ['priority', 'recent', 'city', 'title', 'status'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export const SORT_LABELS: Record<SortKey, string> = {
  priority: 'Priority',
  recent: 'Recently updated',
  city: 'City',
  title: 'Title',
  status: 'Status',
}

export interface Filters {
  q: string
  /** Single-select — it drives the segmented control. */
  priority: Priority | null
  cities: string[]
  categories: string[]
  statuses: Status[]
  sort: SortKey
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  priority: null,
  cities: [],
  categories: [],
  statuses: [],
  sort: 'priority',
}

export function isFiltered(f: Filters): boolean {
  return (
    f.q.trim() !== '' ||
    f.priority !== null ||
    f.cities.length > 0 ||
    f.categories.length > 0 ||
    f.statuses.length > 0
  )
}

export function activeFilterCount(f: Filters): number {
  return f.cities.length + f.categories.length + f.statuses.length
}

/**
 * Within a facet, values OR together. Across facets, they AND.
 * So `city=chongqing & status=ready-to-film` is exactly what you'd expect
 * when you land in Chongqing.
 */
export function applyFilters(
  tiktoks: TikTok[],
  filters: Filters,
  cityName: (id: string) => string,
): TikTok[] {
  const q = filters.q.trim().toLowerCase()
  const terms = q ? q.split(/\s+/) : []

  const out = tiktoks.filter((t) => {
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.cities.length && !filters.cities.includes(t.cityId)) return false
    if (filters.statuses.length && !filters.statuses.includes(t.status)) return false
    if (filters.categories.length && !filters.categories.includes(t.category)) return false
    // Every term must appear somewhere — cheap AND-of-substrings.
    for (const term of terms) if (!t.searchText.includes(term)) return false
    return true
  })

  return sortTikToks(out, filters.sort, cityName)
}

export function sortTikToks(
  tiktoks: TikTok[],
  sort: SortKey,
  cityName: (id: string) => string,
): TikTok[] {
  const byTitle = (a: TikTok, b: TikTok) => a.title.localeCompare(b.title)

  const sorted = [...tiktoks]
  switch (sort) {
    case 'priority':
      sorted.sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          cityName(a.cityId).localeCompare(cityName(b.cityId)) ||
          byTitle(a, b),
      )
      break
    case 'recent':
      sorted.sort((a, b) => {
        const at = a.updatedAt ?? a.createdAt ?? ''
        const bt = b.updatedAt ?? b.createdAt ?? ''
        if (at === bt) return byTitle(a, b)
        if (!at) return 1
        if (!bt) return -1
        return bt.localeCompare(at)
      })
      break
    case 'city':
      sorted.sort(
        (a, b) =>
          cityName(a.cityId).localeCompare(cityName(b.cityId)) ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          byTitle(a, b),
      )
      break
    case 'status':
      sorted.sort(
        (a, b) =>
          STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          byTitle(a, b),
      )
      break
    case 'title':
      sorted.sort(byTitle)
      break
  }
  return sorted
}
