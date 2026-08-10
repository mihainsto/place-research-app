import type { City, Dataset, TikTok } from '@/data/schema'
import { PRIORITIES, STATUSES, type Priority, type Status } from '@/lib/constants'

/**
 * Everything derived from the dataset, computed exactly once at load.
 * The dataset never mutates, so none of this ever needs invalidating.
 */
export interface DataIndex {
  byId: Map<string, TikTok>
  byCity: Map<string, TikTok[]>
  cityById: Map<string, City>
  /** Categories actually present in the data, alphabetical. */
  categories: string[]
  /** How many days of the trip land in each city. Empty when unplanned. */
  daysByCity: Map<string, number>
  counts: {
    byCity: Map<string, number>
    byCategory: Map<string, number>
    byStatus: Record<Status, number>
    byPriority: Record<Priority, number>
  }
}

export function buildIndex(dataset: Dataset): DataIndex {
  const byId = new Map<string, TikTok>()
  const byCity = new Map<string, TikTok[]>()
  const cityById = new Map<string, City>()
  const byCategory = new Map<string, number>()

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>
  const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0])) as Record<Priority, number>

  for (const city of dataset.cities) {
    cityById.set(city.id, city)
    byCity.set(city.id, [])
  }

  for (const t of dataset.tiktoks) {
    byId.set(t.id, t)

    let bucket = byCity.get(t.cityId)
    if (!bucket) {
      bucket = []
      byCity.set(t.cityId, bucket)
    }
    bucket.push(t)

    byStatus[t.status] += 1
    byPriority[t.priority] += 1
    if (t.category) byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1)
  }

  const counts = {
    byCity: new Map([...byCity].map(([id, list]) => [id, list.length])),
    byCategory,
    byStatus,
    byPriority,
  }

  const daysByCity = new Map<string, number>()
  for (const day of dataset.timeline) {
    daysByCity.set(day.cityId, (daysByCity.get(day.cityId) ?? 0) + 1)
  }

  return {
    byId,
    byCity,
    cityById,
    categories: [...byCategory.keys()].sort((a, b) => a.localeCompare(b)),
    daysByCity,
    counts,
  }
}
