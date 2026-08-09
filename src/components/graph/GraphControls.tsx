import { Maximize2, Minus, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Minimal floating chrome. force-graph ships no UI of its own, which is
 * exactly why it was chosen — nothing to override, nothing to fight.
 */

export function GraphSearch({
  value,
  onChange,
  matchCount,
}: {
  value: string
  onChange: (v: string) => void
  matchCount: number | null
}) {
  return (
    <div className="pointer-events-auto flex h-9 w-[min(280px,calc(100vw-88px))] items-center rounded-[9px] border border-hairline bg-raised/90 backdrop-blur-xl">
      <Search aria-hidden className="ml-2.5 size-[15px] shrink-0 text-ink-3" strokeWidth={2} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange('')
        }}
        placeholder="Find in map…"
        aria-label="Find in map"
        className="h-full w-full bg-transparent px-2 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <>
          <span className="shrink-0 text-[12px] tabular-nums text-ink-3">{matchCount ?? 0}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear"
            className="mr-1 ml-1 grid size-6 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink"
          >
            <X aria-hidden className="size-3.5" strokeWidth={2.5} />
          </button>
        </>
      ) : null}
    </div>
  )
}

interface ControlsProps {
  onFit: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  showReferences: boolean
  onToggleReferences: () => void
  expandAll: boolean
  onToggleExpandAll: () => void
  canCollapse: boolean
}

export function GraphControls({
  onFit,
  onZoomIn,
  onZoomOut,
  onReset,
  showReferences,
  onToggleReferences,
  expandAll,
  onToggleExpandAll,
  canCollapse,
}: ControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      <div className="flex flex-col overflow-hidden rounded-[9px] border border-hairline bg-raised/90 backdrop-blur-xl">
        <IconButton label="Zoom in" onClick={onZoomIn}>
          <Plus aria-hidden className="size-4" strokeWidth={2} />
        </IconButton>
        <span aria-hidden className="h-px bg-hairline" />
        <IconButton label="Zoom out" onClick={onZoomOut}>
          <Minus aria-hidden className="size-4" strokeWidth={2} />
        </IconButton>
        <span aria-hidden className="h-px bg-hairline" />
        <IconButton label="Fit to screen" onClick={onFit}>
          <Maximize2 aria-hidden className="size-[15px]" strokeWidth={2} />
        </IconButton>
      </div>

      <div className="flex flex-col items-stretch overflow-hidden rounded-[9px] border border-hairline bg-raised/90 backdrop-blur-xl">
        {canCollapse ? (
          <>
            <Toggle active={expandAll} onClick={onToggleExpandAll}>
              All TikToks
            </Toggle>
            <span aria-hidden className="h-px bg-hairline" />
          </>
        ) : null}
        <Toggle active={showReferences} onClick={onToggleReferences}>
          References
        </Toggle>
        <span aria-hidden className="h-px bg-hairline" />
        <Toggle active={false} onClick={onReset}>
          Reset layout
        </Toggle>
      </div>
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center text-ink-2 transition-colors duration-150 hover:bg-overlay hover:text-ink"
    >
      {children}
    </button>
  )
}

function Toggle({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex h-8 items-center gap-2 px-3 text-[12px] leading-4 font-medium whitespace-nowrap transition-colors duration-150 hover:bg-overlay',
        active ? 'text-ink' : 'text-ink-3',
      )}
    >
      <span
        aria-hidden
        className={cn('size-[5px] shrink-0 rounded-full transition-colors', active ? 'bg-accent' : 'bg-white/15')}
      />
      {children}
    </button>
  )
}

export function GraphLegend() {
  return (
    <div className="pointer-events-none hidden flex-col gap-1.5 rounded-[9px] border border-hairline bg-raised/70 px-3 py-2.5 backdrop-blur-xl md:flex">
      <Row swatch={<span className="size-[9px] rounded-full bg-accent" />}>Project</Row>
      <Row
        swatch={
          <span className="size-[9px] rounded-full border border-ink-2 bg-[#141518]" />
        }
      >
        City
      </Row>
      <Row swatch={<span className="size-[10px] rounded-[3px] border border-white/20 bg-white/10" />}>
        TikTok
      </Row>
      <Row
        swatch={<span className="size-[10px] rounded-[3px] border border-accent/75 bg-white/10" />}
      >
        Must film
      </Row>
      <Row swatch={<span className="size-[7px] rounded-full border border-white/30" />}>Reference</Row>
    </div>
  )
}

function Row({ swatch, children }: { swatch: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[11px] leading-[14px] text-ink-3">
      <span className="grid w-3 place-items-center">{swatch}</span>
      {children}
    </span>
  )
}
