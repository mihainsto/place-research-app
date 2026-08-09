import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Every outbound link looks outbound: an arrow glyph and the hostname.
 * You should never have to guess whether a tap leaves the app.
 */

interface RowProps {
  href: string
  title: string
  /** Right-hand label, e.g. "Instagram Reel". */
  meta?: string
  /** Second line under the title, e.g. `instagram.com`. */
  hostname?: string
  className?: string
}

export function ExternalLinkRow({ href, title, meta, hostname, className }: RowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-4 rounded-card border border-hairline bg-surface px-4 py-3.5',
        'transition-colors duration-150 ease-snappy hover:border-hairline-strong hover:bg-raised',
        'min-h-[56px]',
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-[21px] font-medium text-ink">{title}</span>
        {hostname ? (
          <span className="mt-0.5 flex items-center gap-1 text-[12px] leading-4 text-ink-3">
            <ArrowUpRight aria-hidden className="size-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{hostname}</span>
          </span>
        ) : null}
      </span>
      {meta ? (
        <span className="label-micro mt-1 shrink-0 text-ink-3 transition-colors duration-150 group-hover:text-ink-2">
          {meta}
        </span>
      ) : null}
    </a>
  )
}

interface ButtonProps {
  href: string
  label: string
  /** Shown when we synthesised the URL from the location name. */
  hint?: string
  className?: string
}

export function ExternalLinkButton({ href, label, hint, className }: ButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group inline-flex min-h-[46px] flex-1 items-center justify-between gap-3 rounded-card',
        /* Wide enough that a third map link wraps to its own row rather than
           squeezing all three until the labels break mid-phrase. */
        'min-w-[200px]',
        'border border-hairline bg-surface px-4 py-2.5',
        'text-[15px] leading-[21px] font-medium text-ink',
        'transition-colors duration-150 ease-snappy hover:border-hairline-strong hover:bg-raised',
        className,
      )}
    >
      <span className="flex items-baseline gap-2 whitespace-nowrap">
        {label}
        {hint ? <span className="text-[12px] font-normal text-ink-3">{hint}</span> : null}
      </span>
      <ArrowUpRight
        aria-hidden
        className="size-4 shrink-0 text-ink-3 transition-colors duration-150 group-hover:text-ink-2"
        strokeWidth={2}
      />
    </a>
  )
}
