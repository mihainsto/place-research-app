import type { City, Dataset, Reference, TikTok } from '@/data/schema'
import type { DataIndex } from '@/data/indexes'
import { categoryColor } from '@/lib/constants'

/**
 * dataset → graph.
 *
 * Built ONCE and cached. Node objects are reused for the lifetime of the
 * view, which is what lets us show and hide branches (references, collapsed
 * cities) without the layout jumping — d3-force keeps the positions it has
 * already computed on the very same objects.
 */

export type GraphNodeType = 'project' | 'city' | 'tiktok' | 'reference'

export interface GraphNode {
  id: string
  type: GraphNodeType
  label: string
  /** Half-width for tiktoks (they're drawn as rounded squares), radius otherwise. */
  radius: number
  cityId?: string
  parentTikTokId?: string
  tiktok?: TikTok
  city?: City
  reference?: Reference
  mustFilm: boolean
  cover: string | null
  accentColor: string
  count?: number

  // --- mutated by the renderer / d3-force ---
  /** Tweened opacity, so focus changes fade instead of snapping. */
  alpha?: number
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number
  fy?: number
}

export type GraphLinkKind = 'project-city' | 'city-tiktok' | 'tiktok-ref'

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  kind: GraphLinkKind
}

export interface GraphModel {
  byId: Map<string, GraphNode>
  project: GraphNode
  cities: GraphNode[]
  tiktoks: GraphNode[]
  references: GraphNode[]
  tiktoksByCity: Map<string, GraphNode[]>
  refsByTikTok: Map<string, GraphNode[]>
  /** Where each city's constellation sits. Also seeds initial positions. */
  anchors: Map<string, { x: number; y: number }>
}

export const PROJECT_ID = 'project'
export const cityNodeId = (id: string) => `city:${id}`
export const tiktokNodeId = (id: string) => `tik:${id}`
export const refNodeId = (tiktokId: string, i: number) => `ref:${tiktokId}:${i}`

/** Deterministic jitter — the map looks identical every time you open it. */
function jitter(seed: string, spread: number): { dx: number; dy: number } {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const a = ((h >>> 0) % 3600) / 3600
  const r = (((h >>> 9) % 1000) / 1000) ** 0.5
  return {
    dx: Math.cos(a * Math.PI * 2) * r * spread,
    dy: Math.sin(a * Math.PI * 2) * r * spread,
  }
}

export function buildGraphModel(dataset: Dataset, index: DataIndex): GraphModel {
  const byId = new Map<string, GraphNode>()
  const tiktoksByCity = new Map<string, GraphNode[]>()
  const refsByTikTok = new Map<string, GraphNode[]>()

  const activeCities = dataset.cities.filter((c) => (index.counts.byCity.get(c.id) ?? 0) > 0)

  // Cities sit on a ring around the project. Radius grows with the number of
  // cities so constellations never overlap.
  const anchors = new Map<string, { x: number; y: number }>()
  const ringRadius = Math.max(300, activeCities.length * 82)
  activeCities.forEach((city, i) => {
    const angle = (i / Math.max(1, activeCities.length)) * Math.PI * 2 - Math.PI / 2
    anchors.set(city.id, {
      x: Math.cos(angle) * ringRadius,
      y: Math.sin(angle) * ringRadius,
    })
  })

  const project: GraphNode = {
    id: PROJECT_ID,
    type: 'project',
    label: dataset.projectName,
    radius: 13,
    mustFilm: false,
    cover: null,
    accentColor: '#e0483d',
    count: dataset.tiktoks.length,
    x: 0,
    y: 0,
  }
  byId.set(project.id, project)

  const cities: GraphNode[] = activeCities.map((city) => {
    const count = index.counts.byCity.get(city.id) ?? 0
    const anchor = anchors.get(city.id) ?? { x: 0, y: 0 }
    const node: GraphNode = {
      id: cityNodeId(city.id),
      type: 'city',
      label: city.name,
      radius: 11 + Math.sqrt(count) * 2.6,
      cityId: city.id,
      city,
      mustFilm: false,
      cover: city.coverImage,
      accentColor: '#9b9ba3',
      count,
      x: anchor.x,
      y: anchor.y,
    }
    byId.set(node.id, node)
    tiktoksByCity.set(city.id, [])
    return node
  })

  const tiktoks: GraphNode[] = []
  const references: GraphNode[] = []

  for (const tiktok of dataset.tiktoks) {
    const anchor = anchors.get(tiktok.cityId) ?? { x: 0, y: 0 }
    const offset = jitter(tiktok.id, 130)

    const node: GraphNode = {
      id: tiktokNodeId(tiktok.id),
      type: 'tiktok',
      label: tiktok.title,
      radius: 19,
      cityId: tiktok.cityId,
      tiktok,
      mustFilm: tiktok.priority === 'Must Film',
      cover: tiktok.coverImage,
      accentColor: categoryColor(tiktok.category),
      x: anchor.x + offset.dx,
      y: anchor.y + offset.dy,
    }
    byId.set(node.id, node)
    tiktoks.push(node)

    let bucket = tiktoksByCity.get(tiktok.cityId)
    if (!bucket) {
      bucket = []
      tiktoksByCity.set(tiktok.cityId, bucket)
    }
    bucket.push(node)

    const refNodes: GraphNode[] = tiktok.references.map((reference, i) => {
      const refOffset = jitter(`${tiktok.id}:${i}`, 44)
      const refNode: GraphNode = {
        id: refNodeId(tiktok.id, i),
        type: 'reference',
        label: reference.title,
        radius: 4.5,
        cityId: tiktok.cityId,
        parentTikTokId: node.id,
        reference,
        mustFilm: false,
        cover: null,
        accentColor: '#6b6b73',
        x: (node.x ?? 0) + refOffset.dx,
        y: (node.y ?? 0) + refOffset.dy,
      }
      byId.set(refNode.id, refNode)
      references.push(refNode)
      return refNode
    })
    refsByTikTok.set(node.id, refNodes)
  }

  // City rings stay neutral on purpose. Red means one of two things in this
  // app — must film, or selected — and a city borrowing it reads as both.
  // Volume is already encoded in the ring's radius.

  return { byId, project, cities, tiktoks, references, tiktoksByCity, refsByTikTok, anchors }
}

// ---------------------------------------------------------------------------

export interface VisibilityOptions {
  /** false → only cities and any city the user has expanded. */
  expandAll: boolean
  expandedCities: Set<string>
  showReferences: boolean
  selectedId: string | null
}

/**
 * The visible slice of the model.
 *
 * References are hidden by default because they multiply node count 3–4× and
 * turn the map into a hairball; they appear around whatever you focus, or
 * globally via the toggle. Same idea for collapsed cities at scale.
 */
export function selectVisible(
  model: GraphModel,
  options: VisibilityOptions,
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [model.project, ...model.cities]
  const links: GraphLink[] = model.cities.map((city) => ({
    source: PROJECT_ID,
    target: city.id,
    kind: 'project-city' as const,
  }))

  const selected = options.selectedId ? model.byId.get(options.selectedId) : undefined
  const selectedCityId =
    selected?.type === 'city' ? selected.cityId : undefined

  const visibleTikToks = model.tiktoks.filter((node) => {
    if (options.expandAll) return true
    if (!node.cityId) return false
    if (options.expandedCities.has(node.cityId)) return true
    // Always reveal the constellation you just tapped.
    return node.cityId === selectedCityId
  })

  for (const node of visibleTikToks) {
    nodes.push(node)
    links.push({
      source: cityNodeId(node.cityId ?? ''),
      target: node.id,
      kind: 'city-tiktok',
    })
  }

  const visibleTikTokIds = new Set(visibleTikToks.map((n) => n.id))

  for (const tiktokNode of visibleTikToks) {
    const refs = model.refsByTikTok.get(tiktokNode.id) ?? []
    if (refs.length === 0) continue

    const showAll = options.showReferences
    const isFocused =
      options.selectedId === tiktokNode.id ||
      (selected?.type === 'reference' && selected.parentTikTokId === tiktokNode.id)

    if (!showAll && !isFocused) continue

    for (const ref of refs) {
      nodes.push(ref)
      links.push({ source: tiktokNode.id, target: ref.id, kind: 'tiktok-ref' })
    }
  }

  // Defensive: never emit a link whose endpoints aren't both on screen.
  const present = new Set(nodes.map((n) => n.id))
  return {
    nodes,
    links: links.filter(
      (l) =>
        present.has(l.source as string) &&
        present.has(l.target as string) &&
        (l.kind !== 'tiktok-ref' || visibleTikTokIds.has(l.source as string)),
    ),
  }
}

/**
 * What stays at full opacity. `null` means "everything" — the resting state.
 */
export function computeEmphasis(
  model: GraphModel,
  selectedId: string | null,
  searchMatches: Set<string> | null,
): Set<string> | null {
  if (searchMatches) return searchMatches
  if (!selectedId) return null

  const node = model.byId.get(selectedId)
  if (!node) return null

  const set = new Set<string>([node.id])

  if (node.type === 'project') return null

  if (node.type === 'city') {
    set.add(PROJECT_ID)
    for (const t of model.tiktoksByCity.get(node.cityId ?? '') ?? []) set.add(t.id)
    return set
  }

  if (node.type === 'tiktok') {
    set.add(cityNodeId(node.cityId ?? ''))
    for (const ref of model.refsByTikTok.get(node.id) ?? []) set.add(ref.id)
    return set
  }

  // reference
  if (node.parentTikTokId) {
    set.add(node.parentTikTokId)
    const parent = model.byId.get(node.parentTikTokId)
    if (parent?.cityId) set.add(cityNodeId(parent.cityId))
  }
  return set
}
