import { cn } from '@/lib/cn'

export interface Segment<T extends string> {
  value: T
  label: string
  count?: number
}

interface Props<T extends string> {
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ariaLabel,
  className,
}: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-[9px] border border-hairline bg-surface p-[3px]',
        className,
      )}
    >
      {segments.map((segment) => {
        const active = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              'relative rounded-[6px] px-3 py-[5px] text-[13px] leading-[18px] font-medium whitespace-nowrap',
              'transition-colors duration-150 ease-snappy',
              active
                ? 'bg-overlay text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {segment.label}
            {segment.count !== undefined ? (
              <span
                className={cn(
                  'ml-1.5 text-[12px] tabular-nums',
                  active ? 'text-ink-3' : 'text-ink-3/70',
                )}
              >
                {segment.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
