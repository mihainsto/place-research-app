import { Check } from 'lucide-react'
import { useData } from '@/data/DataContext'
import { STATUSES, STATUS_COLOR, categoryColor } from '@/lib/constants'
import { SORT_KEYS, SORT_LABELS, activeFilterCount } from '@/lib/filters'
import type { FilterControls } from '@/lib/url-state'
import { cn } from '@/lib/cn'

/**
 * One panel, three facets, one sort. Shown in a popover on desktop and a
 * bottom sheet on mobile — same component, so they can never drift.
 */
export function FilterPanel({ controls, onDone }: { controls: FilterControls; onDone?: () => void }) {
  const { dataset, index } = useData()
  const { filters } = controls
  const count = activeFilterCount(filters)

  const cities = dataset.cities
    .map((city) => ({ city, count: index.counts.byCity.get(city.id) ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.city.name.localeCompare(b.city.name))

  return (
    <div className="flex max-h-[70vh] flex-col md:max-h-[min(70vh,560px)]">
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
        <span className="text-[13px] font-medium text-ink-2">
          {count > 0 ? `${count} filter${count === 1 ? '' : 's'} active` : 'Filter'}
        </span>
        {count > 0 ? (
          <button
            type="button"
            onClick={controls.clearAll}
            className="text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        <Group label="City">
          {cities.map(({ city, count: n }) => (
            <Row
              key={city.id}
              label={city.name}
              count={n}
              selected={filters.cities.includes(city.id)}
              onSelect={() => controls.toggleCity(city.id)}
            />
          ))}
        </Group>

        {index.categories.length > 0 ? (
          <Group label="Category">
            {index.categories.map((category) => (
              <Row
                key={category}
                label={category}
                dot={categoryColor(category)}
                count={index.counts.byCategory.get(category) ?? 0}
                selected={filters.categories.includes(category)}
                onSelect={() => controls.toggleCategory(category)}
              />
            ))}
          </Group>
        ) : null}

        <Group label="Status">
          {STATUSES.map((status) => {
            const n = index.counts.byStatus[status]
            if (n === 0) return null
            return (
              <Row
                key={status}
                label={status}
                dot={STATUS_COLOR[status]}
                count={n}
                selected={filters.statuses.includes(status)}
                onSelect={() => controls.toggleStatus(status)}
              />
            )
          })}
        </Group>

        <Group label="Sort by">
          {SORT_KEYS.map((key) => (
            <Row
              key={key}
              label={SORT_LABELS[key]}
              selected={filters.sort === key}
              onSelect={() => controls.setSort(key)}
            />
          ))}
        </Group>
      </div>

      {onDone ? (
        <div className="border-t border-hairline p-3 pb-[calc(0.75rem+var(--safe-b))] md:hidden">
          <button
            type="button"
            onClick={onDone}
            className="h-11 w-full rounded-card bg-overlay text-[15px] font-medium text-ink transition-colors hover:bg-hairline-strong"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 px-1 py-2">
      <p className="label-micro px-2 pb-1.5">{label}</p>
      {children}
    </div>
  )
}

function Row({
  label,
  count,
  dot,
  selected,
  onSelect,
}: {
  label: string
  count?: number
  dot?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex min-h-[38px] w-full items-center gap-2.5 rounded-[7px] px-2 text-left',
        'transition-colors duration-150 hover:bg-overlay',
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {selected ? <Check aria-hidden className="size-4 text-accent" strokeWidth={2.5} /> : null}
      </span>
      {dot ? (
        <span
          aria-hidden
          className="size-[6px] shrink-0 rounded-full"
          style={{ backgroundColor: dot }}
        />
      ) : null}
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[14px] leading-5',
          selected ? 'text-ink' : 'text-ink-2',
        )}
      >
        {label}
      </span>
      {count !== undefined ? (
        <span className="shrink-0 text-[12px] tabular-nums text-ink-3">{count}</span>
      ) : null}
    </button>
  )
}
