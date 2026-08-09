import { X } from 'lucide-react'
import { useData } from '@/data/DataContext'
import { STATUS_COLOR, categoryColor } from '@/lib/constants'
import { activeFilterCount } from '@/lib/filters'
import type { FilterControls } from '@/lib/url-state'

/**
 * `City = Chongqing AND Status = Ready to Film` is exactly this: two pills.
 * The compound filter you actually use on the ground stays visible and
 * one-tap removable.
 */
export function ActiveFilterPills({ controls }: { controls: FilterControls }) {
  const { index } = useData()
  const { filters } = controls

  if (activeFilterCount(filters) === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.cities.map((cityId) => (
        <Pill
          key={`city-${cityId}`}
          label={index.cityById.get(cityId)?.name ?? cityId}
          onRemove={() => controls.toggleCity(cityId)}
        />
      ))}
      {filters.categories.map((category) => (
        <Pill
          key={`cat-${category}`}
          label={category}
          dot={categoryColor(category)}
          onRemove={() => controls.toggleCategory(category)}
        />
      ))}
      {filters.statuses.map((status) => (
        <Pill
          key={`status-${status}`}
          label={status}
          dot={STATUS_COLOR[status]}
          onRemove={() => controls.toggleStatus(status)}
        />
      ))}
      <button
        type="button"
        onClick={controls.clearAll}
        className="ml-1 text-[12px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        Clear
      </button>
    </div>
  )
}

function Pill({
  label,
  dot,
  onRemove,
}: {
  label: string
  dot?: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex h-[26px] items-center gap-1.5 rounded-tag border border-hairline bg-surface pr-1 pl-2.5 text-[12px] leading-4 text-ink-2">
      {dot ? (
        <span aria-hidden className="size-[5px] rounded-full" style={{ backgroundColor: dot }} />
      ) : null}
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="grid size-[18px] place-items-center rounded-full text-ink-3 transition-colors hover:bg-overlay hover:text-ink"
      >
        <X aria-hidden className="size-3" strokeWidth={2.5} />
      </button>
    </span>
  )
}
