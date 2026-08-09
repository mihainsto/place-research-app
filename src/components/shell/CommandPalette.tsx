import { useEffect, useMemo } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/data/DataContext'
import { PRIORITY_RANK } from '@/lib/constants'

/**
 * ⌘K from anywhere. On mobile it is the third tab, because "find the one I
 * need" is the whole mobile job.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { dataset, index } = useData()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  const tiktoks = useMemo(
    () =>
      [...dataset.tiktoks].sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.title.localeCompare(b.title),
      ),
    [dataset.tiktoks],
  )

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search"
      shouldFilter
      overlayClassName="fixed inset-0 z-[60] bg-black/60 animate-[fade-in_160ms_ease-out]"
      contentClassName="fixed left-1/2 top-[12vh] z-[70] w-[min(560px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-sheet border border-hairline bg-raised shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8)] animate-[rise-in_180ms_cubic-bezier(0.32,0.72,0,1)]"
    >
      <Command.Input
        placeholder="Search TikToks, cities…"
        className="h-[52px] w-full border-b border-hairline bg-transparent px-4 text-[16px] text-ink placeholder:text-ink-3 focus:outline-none"
      />

      <Command.List className="max-h-[min(56vh,420px)] overflow-y-auto overscroll-contain p-2">
        <Command.Empty className="px-3 py-8 text-center text-[14px] text-ink-3">
          Nothing matches that.
        </Command.Empty>

        <Command.Group
          heading="Go to"
          className="[&_[cmdk-group-heading]]:label-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5"
        >
          <Item onSelect={() => go('/')} value="wall grid cards home">
            Wall
          </Item>
          <Item onSelect={() => go('/graph')} value="graph network map explore">
            Graph
          </Item>
        </Command.Group>

        <Command.Group
          heading="TikToks"
          className="[&_[cmdk-group-heading]]:label-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5"
        >
          {tiktoks.map((tiktok) => {
            const city = index.cityById.get(tiktok.cityId)?.name ?? ''
            return (
              <Item
                key={tiktok.id}
                value={`${tiktok.title} ${city} ${tiktok.category} ${tiktok.status} ${tiktok.priority}`}
                onSelect={() => go(`/t/${tiktok.id}`)}
                meta={city}
              >
                {tiktok.title}
              </Item>
            )
          })}
        </Command.Group>

        <Command.Group
          heading="Cities"
          className="[&_[cmdk-group-heading]]:label-micro [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5"
        >
          {dataset.cities.map((city) => {
            const count = index.counts.byCity.get(city.id) ?? 0
            if (count === 0) return null
            return (
              <Item
                key={city.id}
                value={`${city.name} city ${city.region ?? ''}`}
                onSelect={() => go(`/city/${city.id}`)}
                meta={`${count}`}
              >
                {city.name}
              </Item>
            )
          })}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

function Item({
  children,
  value,
  meta,
  onSelect,
}: {
  children: React.ReactNode
  value: string
  meta?: string
  onSelect: () => void
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex h-[38px] cursor-pointer items-center gap-3 rounded-[7px] px-2.5 text-[14px] text-ink-2 data-[selected=true]:bg-overlay data-[selected=true]:text-ink"
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {meta ? <span className="shrink-0 text-[12px] text-ink-3">{meta}</span> : null}
    </Command.Item>
  )
}
