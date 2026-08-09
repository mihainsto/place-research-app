import { categoryColor, STATUS_COLOR, type Priority, type Status } from '@/lib/constants'
import { cn } from '@/lib/cn'

/**
 * Tags are text + a 5px dot. Never a filled block.
 * That one rule is most of what keeps the Wall from reading like a Jira board.
 */

/** Brightened accent — #e0483d is fine for dots, marginal for 11px text. */
const ACCENT_TEXT = '#f0655a'

function Dot({ color, ring = false }: { color: string; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className="size-[5px] shrink-0 rounded-full"
      style={ring ? { boxShadow: `inset 0 0 0 1px ${color}` } : { backgroundColor: color }}
    />
  )
}

const base = 'inline-flex items-center gap-1.5 text-[11px] leading-[14px] font-semibold tracking-[0.07em] uppercase whitespace-nowrap'

export function PriorityTag({ priority, className }: { priority: Priority; className?: string }) {
  const isMust = priority === 'Must Film'
  return (
    <span
      className={cn(base, className)}
      style={{ color: isMust ? ACCENT_TEXT : 'var(--color-ink-3)' }}
    >
      <Dot color={isMust ? ACCENT_TEXT : 'var(--color-ink-3)'} ring={!isMust} />
      {priority}
    </span>
  )
}

export function CategoryTag({ category, className }: { category: string; className?: string }) {
  if (!category) return null
  return (
    <span className={cn(base, 'text-ink-3', className)}>
      <Dot color={categoryColor(category)} />
      {category}
    </span>
  )
}

export function StatusTag({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn(base, 'text-ink-3', className)}>
      <Dot color={STATUS_COLOR[status]} />
      {status}
    </span>
  )
}
