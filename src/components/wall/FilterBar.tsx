import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PRIORITIES, type Priority } from '@/lib/constants'
import { activeFilterCount } from '@/lib/filters'
import type { FilterControls } from '@/lib/url-state'
import { useIsMobile } from '@/lib/useMediaQuery'
import { SegmentedControl, type Segment } from '@/components/ui/SegmentedControl'
import { FilterPanel } from '@/components/wall/FilterPanel'
import { ActiveFilterPills } from '@/components/wall/ActiveFilterPills'
import { cn } from '@/lib/cn'

type PrioritySegment = Priority | 'all'

const SEGMENTS: Segment<PrioritySegment>[] = [
  { value: 'all', label: 'All' },
  ...PRIORITIES.map((p) => ({ value: p as PrioritySegment, label: p })),
]

/**
 * The only chrome on the Wall: priority, filters, search.
 * Everything it does is written to the URL, so any state you can see here is
 * a state you can bookmark.
 */
export function FilterBar({ controls, resultCount }: { controls: FilterControls; resultCount: number }) {
  const isMobile = useIsMobile()
  const [panelOpen, setPanelOpen] = useState(false)
  const count = activeFilterCount(controls.filters)

  const priorityValue: PrioritySegment = controls.filters.priority ?? 'all'

  const trigger = (
    <button
      type="button"
      className={cn(
        'inline-flex h-[34px] shrink-0 items-center gap-2 rounded-[9px] border px-3',
        'text-[13px] leading-[18px] font-medium transition-colors duration-150 ease-snappy',
        count > 0
          ? 'border-hairline-strong bg-overlay text-ink'
          : 'border-hairline bg-surface text-ink-2 hover:text-ink',
      )}
    >
      <SlidersHorizontal aria-hidden className="size-[15px]" strokeWidth={2} />
      Filters
      {count > 0 ? <span className="text-[12px] tabular-nums text-ink-3">{count}</span> : null}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <SearchField
          value={controls.filters.q}
          onChange={controls.setQuery}
          className="order-first md:order-last md:ml-auto md:max-w-[280px]"
        />

        <div className="no-scrollbar -mx-5 flex items-center gap-3 overflow-x-auto px-5 md:mx-0 md:overflow-visible md:px-0">
          <SegmentedControl
            ariaLabel="Filter by priority"
            segments={SEGMENTS}
            value={priorityValue}
            onChange={(value) => controls.setPriority(value === 'all' ? null : value)}
          />

          {isMobile ? (
            <Dialog.Root open={panelOpen} onOpenChange={setPanelOpen}>
              <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-[fade-in_180ms_ease-out]" />
                <Dialog.Content
                  aria-describedby={undefined}
                  className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-sheet border-t border-hairline bg-raised data-[state=open]:animate-[sheet-up_260ms_cubic-bezier(0.32,0.72,0,1)]"
                >
                  <Dialog.Title className="sr-only">Filters</Dialog.Title>
                  <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-white/15" />
                  <FilterPanel controls={controls} onDone={() => setPanelOpen(false)} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ) : (
            <Popover.Root open={panelOpen} onOpenChange={setPanelOpen}>
              <Popover.Trigger asChild>{trigger}</Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="start"
                  sideOffset={8}
                  collisionPadding={16}
                  className="z-50 w-[280px] overflow-hidden rounded-sheet border border-hairline bg-raised shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)] data-[state=open]:animate-[pop-in_160ms_cubic-bezier(0.32,0.72,0,1)]"
                >
                  <FilterPanel controls={controls} />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}

          <span className="ml-auto shrink-0 pl-2 text-[13px] tabular-nums text-ink-3 md:ml-0">
            {resultCount}
          </span>
        </div>
      </div>

      <ActiveFilterPills controls={controls} />
    </div>
  )
}

function SearchField({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [local, setLocal] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  // Keep in sync when the URL changes from elsewhere (pills, ⌘K, back button).
  useEffect(() => setLocal(value), [value])

  // Debounce so typing doesn't write a history entry per keystroke.
  useEffect(() => {
    if (local === value) return
    const id = setTimeout(() => onChange(local), 140)
    return () => clearTimeout(id)
  }, [local, value, onChange])

  return (
    <div
      className={cn(
        'relative flex h-[34px] w-full items-center rounded-[9px] border border-hairline bg-surface',
        'transition-colors duration-150 focus-within:border-hairline-strong',
        className,
      )}
    >
      <Search aria-hidden className="pointer-events-none absolute left-2.5 size-[15px] text-ink-3" strokeWidth={2} />
      <input
        ref={ref}
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocal('')
            onChange('')
            ref.current?.blur()
          }
        }}
        placeholder="Search titles, scripts, places…"
        aria-label="Search TikToks"
        className="h-full w-full bg-transparent pr-8 pl-[30px] text-[13px] leading-[18px] text-ink placeholder:text-ink-3 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {local ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setLocal('')
            onChange('')
          }}
          className="absolute right-1.5 grid size-6 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink"
        >
          <X aria-hidden className="size-3.5" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  )
}
