import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

/**
 * Every list and every section has one of these. An absent script, an
 * unreferenced TikTok and a filter with no matches should all look
 * deliberate — never like something failed to load.
 */
export function EmptyState({ title, description, action, className, compact }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10' : 'py-24',
        className,
      )}
    >
      <p className="text-[17px] leading-[24px] font-medium text-ink-2">{title}</p>
      {description ? (
        <p className="mt-2 max-w-[42ch] text-[14px] leading-[21px] text-ink-3">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
