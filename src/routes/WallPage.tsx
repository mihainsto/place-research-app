import { useMemo } from 'react'
import { useData } from '@/data/DataContext'
import { applyFilters, isFiltered } from '@/lib/filters'
import { useFilters } from '@/lib/url-state'
import { FilterBar } from '@/components/wall/FilterBar'
import { WallGrid } from '@/components/wall/WallGrid'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * The home view. No page title — the grid is the content and the sidebar
 * already says where you are. Everything above the cards is one filter bar.
 */
export function WallPage() {
  const { dataset, index } = useData()
  const controls = useFilters()

  const cityName = useMemo(
    () => (id: string) => index.cityById.get(id)?.name ?? '',
    [index.cityById],
  )

  const visible = useMemo(
    () => applyFilters(dataset.tiktoks, controls.filters, cityName),
    [dataset.tiktoks, controls.filters, cityName],
  )

  return (
    <div className="page pt-6 pb-[calc(72px+var(--safe-b))] md:pt-10 md:pb-24">
      <h1 className="sr-only">{dataset.projectName} — Wall</h1>

      <div className="sticky top-12 z-10 -mx-5 bg-canvas/90 px-5 pt-1 pb-4 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:px-0 md:pt-0 md:pb-8 md:backdrop-blur-none">
        <FilterBar controls={controls} resultCount={visible.length} />
      </div>

      {dataset.tiktoks.length === 0 ? (
        <EmptyState
          title="No TikToks yet"
          description="Add entries to public/data/china-2026.json and they appear here. There is no form — the JSON is the source of truth."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try removing a filter or widening the search."
          action={
            isFiltered(controls.filters) ? (
              <button
                type="button"
                onClick={controls.clearAll}
                className="h-9 rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <WallGrid tiktoks={visible} />
      )}
    </div>
  )
}
