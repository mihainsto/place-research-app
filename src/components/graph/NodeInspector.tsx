import { Link } from 'react-router-dom'
import { ArrowUpRight, X } from 'lucide-react'
import type { GraphModel, GraphNode } from '@/lib/graph/model'
import { cityNodeId } from '@/lib/graph/model'
import { referenceLabel } from '@/lib/references'
import { STATUS_COLOR, categoryColor } from '@/lib/constants'
import { CoverImage } from '@/components/ui/CoverImage'
import { CategoryTag, PriorityTag, StatusTag } from '@/components/ui/Tag'
import { cn } from '@/lib/cn'

/**
 * Selection detail. A side panel on desktop (context stays on screen) and a
 * non-modal bottom sheet on mobile (the map stays interactive underneath).
 *
 * It deliberately does NOT try to be the detail page — it ends in a link to
 * the real one.
 */
export function NodeInspector({
  node,
  model,
  onSelect,
  onClose,
}: {
  node: GraphNode
  model: GraphModel
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <>
      <aside className="hidden w-[360px] shrink-0 flex-col overflow-y-auto border-l border-hairline bg-canvas md:flex">
        <Body node={node} model={model} onSelect={onSelect} onClose={onClose} />
      </aside>

      <div className="pointer-events-auto fixed inset-x-0 bottom-[calc(52px+var(--safe-b))] z-20 max-h-[46dvh] overflow-y-auto overscroll-contain rounded-t-sheet border-t border-hairline bg-raised md:hidden">
        <div aria-hidden className="mx-auto mt-2.5 h-1 w-9 rounded-full bg-white/15" />
        <Body node={node} model={model} onSelect={onSelect} onClose={onClose} />
      </div>
    </>
  )
}

function Body({
  node,
  model,
  onSelect,
  onClose,
}: {
  node: GraphNode
  model: GraphModel
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="label-micro pt-1">{typeLabel(node)}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-[7px] text-ink-3 transition-colors hover:bg-overlay hover:text-ink"
        >
          <X aria-hidden className="size-4" strokeWidth={2} />
        </button>
      </div>

      {node.type === 'tiktok' ? <TikTokBody node={node} model={model} onSelect={onSelect} /> : null}
      {node.type === 'city' ? <CityBody node={node} model={model} onSelect={onSelect} /> : null}
      {node.type === 'reference' ? <ReferenceBody node={node} model={model} onSelect={onSelect} /> : null}
      {node.type === 'project' ? <ProjectBody node={node} model={model} onSelect={onSelect} /> : null}
    </div>
  )
}

function typeLabel(node: GraphNode): string {
  switch (node.type) {
    case 'project':
      return 'Project'
    case 'city':
      return 'City'
    case 'tiktok':
      return 'TikTok'
    default:
      return 'Reference'
  }
}

function TikTokBody({
  node,
  model,
  onSelect,
}: {
  node: GraphNode
  model: GraphModel
  onSelect: (id: string) => void
}) {
  const tiktok = node.tiktok
  if (!tiktok) return null
  const city = model.byId.get(cityNodeId(tiktok.cityId))
  const refs = model.refsByTikTok.get(node.id) ?? []
  const excerpt = tiktok.script.replace(/[#*>`_]/g, '').replace(/\s+/g, ' ').trim()

  return (
    <>
      <CoverImage
        src={tiktok.coverImage}
        alt=""
        fallbackText={tiktok.title}
        className="aspect-3/2 w-full rounded-card border border-hairline"
      />

      <h2 className="mt-4 text-[19px] leading-[25px] font-semibold tracking-[-0.014em] text-ink">
        {tiktok.title}
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
        <PriorityTag priority={tiktok.priority} />
        <CategoryTag category={tiktok.category} />
        <StatusTag status={tiktok.status} />
      </div>

      {city ? (
        <button
          type="button"
          onClick={() => onSelect(city.id)}
          className="mt-4 text-[14px] leading-5 text-ink-2 transition-colors hover:text-ink"
        >
          {city.label}
        </button>
      ) : null}

      {tiktok.location?.name ? (
        <p className="mt-4 text-[13px] leading-[19px] text-ink-3">{tiktok.location.name}</p>
      ) : null}

      {refs.length > 0 ? (
        <div className="mt-5">
          <p className="label-micro pb-2">References</p>
          <div className="flex flex-col gap-1">
            {refs.map((ref) => (
              <button
                key={ref.id}
                type="button"
                onClick={() => onSelect(ref.id)}
                className="rounded-[7px] px-2 py-1.5 text-left text-[13px] leading-[18px] text-ink-2 transition-colors hover:bg-overlay hover:text-ink"
              >
                {ref.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {excerpt ? (
        <div className="mt-5">
          <p className="label-micro pb-2">Script</p>
          <p className="line-clamp-4 text-[14px] leading-[21px] text-ink-2">{excerpt}</p>
        </div>
      ) : null}

      <Link
        to={`/t/${tiktok.id}`}
        className="mt-6 flex h-11 items-center justify-between rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
      >
        Open full page
        <ArrowUpRight aria-hidden className="size-4 text-ink-3" strokeWidth={2} />
      </Link>
    </>
  )
}

function CityBody({
  node,
  model,
  onSelect,
}: {
  node: GraphNode
  model: GraphModel
  onSelect: (id: string) => void
}) {
  const tiktoks = model.tiktoksByCity.get(node.cityId ?? '') ?? []

  return (
    <>
      <h2 className="text-[22px] leading-[28px] font-semibold tracking-[-0.018em] text-ink">
        {node.label}
      </h2>
      <p className="mt-1.5 text-[13px] leading-[18px] text-ink-3">
        {node.city?.region ? `${node.city.region} · ` : ''}
        {tiktoks.length} TikTok{tiktoks.length === 1 ? '' : 's'}
      </p>

      <div className="mt-5 flex flex-col gap-0.5">
        {tiktoks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="flex items-center gap-2.5 rounded-[7px] px-2 py-2 text-left transition-colors hover:bg-overlay"
          >
            <span
              aria-hidden
              className="size-[6px] shrink-0 rounded-full"
              style={{ backgroundColor: t.tiktok ? STATUS_COLOR[t.tiktok.status] : '#6b6b73' }}
            />
            <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-ink-2">
              {t.label}
            </span>
            {t.mustFilm ? (
              <span
                aria-hidden
                className="size-[5px] shrink-0 rounded-full"
                style={{ backgroundColor: '#e0483d' }}
              />
            ) : null}
          </button>
        ))}
      </div>

      {node.cityId ? (
        <Link
          to={`/city/${node.cityId}`}
          className="mt-6 flex h-11 items-center justify-between rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
        >
          Open city
          <ArrowUpRight aria-hidden className="size-4 text-ink-3" strokeWidth={2} />
        </Link>
      ) : null}
    </>
  )
}

function ReferenceBody({
  node,
  model,
  onSelect,
}: {
  node: GraphNode
  model: GraphModel
  onSelect: (id: string) => void
}) {
  const reference = node.reference
  if (!reference) return null
  const parent = node.parentTikTokId ? model.byId.get(node.parentTikTokId) : undefined

  return (
    <>
      <h2 className="text-[17px] leading-[23px] font-semibold text-ink">{reference.title}</h2>
      <p className="mt-1.5 text-[13px] leading-[18px] text-ink-3">
        {referenceLabel(reference.url, reference.type)}
        {reference.hostname ? ` · ${reference.hostname}` : ''}
      </p>

      {parent ? (
        <button
          type="button"
          onClick={() => onSelect(parent.id)}
          className="mt-5 w-full rounded-[7px] px-2 py-2 text-left text-[13px] leading-[18px] text-ink-2 transition-colors hover:bg-overlay hover:text-ink"
        >
          ← {parent.label}
        </button>
      ) : null}

      <a
        href={reference.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex h-11 items-center justify-between rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
      >
        Open reference
        <ArrowUpRight aria-hidden className="size-4 text-ink-3" strokeWidth={2} />
      </a>
    </>
  )
}

function ProjectBody({
  node,
  model,
  onSelect,
}: {
  node: GraphNode
  model: GraphModel
  onSelect: (id: string) => void
}) {
  return (
    <>
      <h2 className="text-[22px] leading-[28px] font-semibold tracking-[-0.018em] text-ink">
        {node.label}
      </h2>
      <p className="mt-1.5 text-[13px] leading-[18px] text-ink-3">
        {model.tiktoks.length} TikToks across {model.cities.length} cities
      </p>

      <div className="mt-5 flex flex-col gap-0.5">
        {model.cities.map((city) => (
          <button
            key={city.id}
            type="button"
            onClick={() => onSelect(city.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-[7px] px-2 py-2 text-left transition-colors hover:bg-overlay',
            )}
          >
            <span
              aria-hidden
              className="size-[6px] shrink-0 rounded-full"
              style={{ backgroundColor: categoryColor(undefined) }}
            />
            <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-ink-2">
              {city.label}
            </span>
            <span className="shrink-0 text-[12px] tabular-nums text-ink-3">{city.count}</span>
          </button>
        ))}
      </div>
    </>
  )
}
