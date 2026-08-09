import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  label: string
  children: ReactNode
  className?: string
  /** Right-hand slot, e.g. a count or a small control. */
  aside?: ReactNode
}

/**
 * The detail page's only structural device: a hairline, a micro label,
 * content. No cards, no boxes, no accordions.
 */
export function Section({ label, children, className, aside }: Props) {
  return (
    <section className={cn('mt-12 border-t border-hairline pt-7 md:mt-14 md:pt-8', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="label-micro">{label}</h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
