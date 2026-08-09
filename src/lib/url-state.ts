import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '@/data/DataContext'
import { PRIORITIES, STATUSES, type Priority, type Status } from '@/lib/constants'
import { EMPTY_FILTERS, SORT_KEYS, type Filters, type SortKey } from '@/lib/filters'
import { slugify } from '@/lib/slug'

/**
 * Filter state lives in the URL, not in a store.
 *
 * `/?city=chongqing&status=ready-to-film` is a bookmark you tap when you land
 * in Chongqing. It survives reload, it works with the back button, and it can
 * be texted to yourself. That is worth more than any state library here.
 */

const PARAM = {
  q: 'q',
  priority: 'priority',
  city: 'city',
  category: 'category',
  status: 'status',
  sort: 'sort',
} as const

const STATUS_BY_SLUG = new Map(STATUSES.map((s) => [slugify(s), s]))
const PRIORITY_BY_SLUG = new Map(PRIORITIES.map((p) => [slugify(p), p]))

export const statusSlug = (s: Status) => slugify(s)
export const prioritySlug = (p: Priority) => slugify(p)

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key)
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface FilterControls {
  filters: Filters
  setQuery: (q: string) => void
  setPriority: (p: Priority | null) => void
  toggleCity: (cityId: string) => void
  toggleCategory: (category: string) => void
  toggleStatus: (status: Status) => void
  setSort: (sort: SortKey) => void
  clearAll: () => void
  /** Slug → display value, for category chips read back out of the URL. */
  categoryBySlug: Map<string, string>
}

export function useFilters(): FilterControls {
  const [params, setParams] = useSearchParams()
  const { index } = useData()

  const categoryBySlug = useMemo(
    () => new Map(index.categories.map((c) => [slugify(c), c])),
    [index.categories],
  )

  const filters = useMemo<Filters>(() => {
    const cities = readList(params, PARAM.city).filter((id) => index.cityById.has(id))

    const categories = readList(params, PARAM.category)
      .map((slug) => categoryBySlug.get(slug))
      .filter((c): c is string => Boolean(c))

    const statuses = readList(params, PARAM.status)
      .map((slug) => STATUS_BY_SLUG.get(slug))
      .filter((s): s is Status => Boolean(s))

    const prioritySlugParam = params.get(PARAM.priority)
    const priority = prioritySlugParam ? (PRIORITY_BY_SLUG.get(prioritySlugParam) ?? null) : null

    const sortParam = params.get(PARAM.sort)
    const sort = (SORT_KEYS as readonly string[]).includes(sortParam ?? '')
      ? (sortParam as SortKey)
      : EMPTY_FILTERS.sort

    return {
      q: params.get(PARAM.q) ?? '',
      priority,
      cities,
      categories,
      statuses,
      sort,
    }
  }, [params, index.cityById, categoryBySlug])

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params)
      mutate(next)
      // `replace` keeps the back button meaning "previous screen", not
      // "previous keystroke".
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      update((next) => {
        if (value) next.set(key, value)
        else next.delete(key)
      })
    },
    [update],
  )

  const toggleInList = useCallback(
    (key: string, value: string) => {
      update((next) => {
        const current = readList(next, key)
        const found = current.indexOf(value)
        if (found >= 0) current.splice(found, 1)
        else current.push(value)
        if (current.length) next.set(key, current.join(','))
        else next.delete(key)
      })
    },
    [update],
  )

  return {
    filters,
    categoryBySlug,
    setQuery: (q) => setSingle(PARAM.q, q.trim() ? q : null),
    setPriority: (p) => setSingle(PARAM.priority, p ? prioritySlug(p) : null),
    toggleCity: (cityId) => toggleInList(PARAM.city, cityId),
    toggleCategory: (category) => toggleInList(PARAM.category, slugify(category)),
    toggleStatus: (status) => toggleInList(PARAM.status, statusSlug(status)),
    setSort: (sort) => setSingle(PARAM.sort, sort === EMPTY_FILTERS.sort ? null : sort),
    clearAll: () =>
      update((next) => {
        for (const key of Object.values(PARAM)) next.delete(key)
      }),
  }
}
