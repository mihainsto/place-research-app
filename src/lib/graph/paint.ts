import { getCoverImage } from '@/lib/graph/image-cache'
import type { GraphLink, GraphNode } from '@/lib/graph/model'

/**
 * Every pixel of every node is drawn here.
 *
 * That is the whole reason for choosing a canvas graph: TikTok nodes are
 * their own cover images, priority is a ring, focus is a real opacity
 * transition rather than a snap. None of it looks like a dependency graph.
 *
 * Two things keep this fast at hundreds of nodes:
 *   · level of detail — below a zoom threshold we draw dots, not images
 *   · the module-level image cache — each cover decodes once per session
 */

export interface PaintState {
  /** Ids at full opacity. `null` = resting state, everything lit. */
  emphasis: Set<string> | null
  selectedId: string | null
  hoveredId: string | null
  reducedMotion: boolean
}

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`

const DIM_ALPHA = 0.12
const TWEEN = 0.16

// Zoom thresholds. Below these we draw progressively less.
const LOD_IMAGE = 0.34
const LOD_TIKTOK_LABEL = 0.6
const LOD_REF_LABEL = 1.4
const LOD_CITY_COUNT = 0.55

function tween(current: number | undefined, target: number, reducedMotion: boolean): number {
  if (reducedMotion || current === undefined) return target
  const next = current + (target - current) * TWEEN
  return Math.abs(next - target) < 0.004 ? target : next
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** object-fit: cover, in canvas terms. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return

  const scale = Math.max(w / iw, h / ih)
  const sw = w / scale
  const sh = h / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

/**
 * Truncation is measured with `measureText`, which is far too expensive to
 * redo every frame — at 250 nodes that was ~100k measurements per second.
 *
 * Both the font size and the max width are divided by `globalScale`, so the
 * *result* is zoom-invariant: it only depends on the text and the
 * width-to-font-size ratio. That makes it almost perfectly cacheable.
 */
const truncCache = new Map<string, string>()
const TRUNC_CACHE_LIMIT = 4000

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  cacheKey: string,
): string {
  const cached = truncCache.get(cacheKey)
  if (cached !== undefined) return cached

  let result = text
  if (ctx.measureText(text).width > maxWidth) {
    let lo = 0
    let hi = text.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      if (ctx.measureText(`${text.slice(0, mid)}…`).width <= maxWidth) lo = mid
      else hi = mid - 1
    }
    result = `${text.slice(0, lo)}…`
  }

  if (truncCache.size > TRUNC_CACHE_LIMIT) truncCache.clear()
  truncCache.set(cacheKey, result)
  return result
}

function label(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = '500',
  maxWidth = 150,
) {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = color
  const ratio = size > 0 ? (maxWidth / size).toFixed(2) : '0'
  ctx.fillText(truncate(ctx, text, maxWidth, `${weight}|${ratio}|${text}`), x, y)
}

export function paintNode(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  state: PaintState,
) {
  const x = node.x ?? 0
  const y = node.y ?? 0

  const targetAlpha = !state.emphasis || state.emphasis.has(node.id) ? 1 : DIM_ALPHA
  node.alpha = tween(node.alpha, targetAlpha, state.reducedMotion)

  const selected = state.selectedId === node.id
  const hovered = state.hoveredId === node.id
  const lift = hovered || selected ? 1.07 : 1
  // Whatever you're pointing at or have selected always names itself, however
  // far out you are.
  const forceLabel = selected || hovered

  ctx.save()
  ctx.globalAlpha = node.alpha

  switch (node.type) {
    case 'project':
      paintProject(node, ctx, globalScale, x, y, selected)
      break
    case 'city':
      paintCity(node, ctx, globalScale, x, y, selected, lift, forceLabel)
      break
    case 'tiktok':
      paintTikTok(node, ctx, globalScale, x, y, selected, lift, forceLabel)
      break
    case 'reference':
      paintReference(node, ctx, globalScale, x, y, selected, forceLabel)
      break
  }

  ctx.restore()
}

function paintProject(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  x: number,
  y: number,
  selected: boolean,
) {
  const r = node.radius

  ctx.beginPath()
  ctx.arc(x, y, r + 6, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(224,72,61,0.22)'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#e0483d'
  ctx.fill()

  if (selected) {
    ctx.beginPath()
    ctx.arc(x, y, r + 10, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(224,72,61,0.5)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  label(ctx, node.label, x, y + r + 11, 13 / globalScale, '#f2f2f5', '600', 220 / globalScale)
}

function paintCity(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  x: number,
  y: number,
  selected: boolean,
  lift: number,
  forceLabel: boolean,
) {
  const r = node.radius * lift

  if (selected) {
    ctx.beginPath()
    ctx.arc(x, y, r + 9, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(224,72,61,0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#141518'
  ctx.fill()
  ctx.strokeStyle = selected ? '#e0483d' : node.accentColor
  ctx.lineWidth = selected ? 2 : 1.6
  ctx.stroke()

  label(ctx, node.label, x, y + r + 9, 13 / globalScale, '#f2f2f5', '600', 200 / globalScale)

  if ((globalScale > LOD_CITY_COUNT || forceLabel) && node.count !== undefined) {
    label(
      ctx,
      `${node.count}`,
      x,
      y + r + 9 + 15 / globalScale,
      11 / globalScale,
      '#6b6b73',
      '500',
      200 / globalScale,
    )
  }
}

function paintTikTok(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  x: number,
  y: number,
  selected: boolean,
  lift: number,
  forceLabel: boolean,
) {
  const r = node.radius * lift
  const size = r * 2
  const left = x - r
  const top = y - r
  const radius = 6

  // Far out: a dot is enough, and it's ~40× cheaper than an image.
  if (globalScale < LOD_IMAGE && !forceLabel) {
    ctx.beginPath()
    ctx.arc(x, y, Math.max(2.4, r * 0.34), 0, Math.PI * 2)
    ctx.fillStyle = node.mustFilm ? '#e0483d' : '#54555c'
    ctx.fill()
    return
  }

  if (selected) {
    ctx.save()
    ctx.shadowColor = 'rgba(224,72,61,0.55)'
    ctx.shadowBlur = 18
    roundRect(ctx, left, top, size, size, radius)
    ctx.fillStyle = '#0f1012'
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  roundRect(ctx, left, top, size, size, radius)
  ctx.clip()

  const img = getCoverImage(node.cover)
  if (img) {
    drawCover(ctx, img, left, top, size, size)
  } else {
    ctx.fillStyle = '#16181b'
    ctx.fillRect(left, top, size, size)
    ctx.font = `600 ${size * 0.5}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.14)'
    ctx.fillText(node.label.trim().charAt(0).toUpperCase() || '·', x, y + 1)
  }
  ctx.restore()

  roundRect(ctx, left, top, size, size, radius)
  if (selected) {
    ctx.strokeStyle = '#e0483d'
    ctx.lineWidth = 2
  } else if (node.mustFilm) {
    ctx.strokeStyle = 'rgba(224,72,61,0.75)'
    ctx.lineWidth = 1.4
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'
    ctx.lineWidth = 1
  }
  ctx.stroke()

  if (globalScale > LOD_TIKTOK_LABEL || forceLabel) {
    label(
      ctx,
      node.label,
      x,
      y + r + 7,
      11.5 / globalScale,
      selected ? '#f2f2f5' : '#9b9ba3',
      '500',
      140 / globalScale,
    )
  }
}

function paintReference(
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  x: number,
  y: number,
  selected: boolean,
  forceLabel: boolean,
) {
  const r = node.radius

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#0b0c0e'
  ctx.fill()
  ctx.strokeStyle = selected ? '#e0483d' : 'rgba(255,255,255,0.28)'
  ctx.lineWidth = selected ? 1.6 : 1
  ctx.stroke()

  if (globalScale > LOD_REF_LABEL || forceLabel) {
    label(ctx, node.label, x, y + r + 5, 10 / globalScale, '#6b6b73', '500', 110 / globalScale)
  }
}

/**
 * Hit area. Kept generous (and square for TikToks) so a thumb on a phone
 * lands where the eye expects.
 */
export function paintPointerArea(
  node: GraphNode,
  color: string,
  ctx: CanvasRenderingContext2D,
) {
  const x = node.x ?? 0
  const y = node.y ?? 0
  ctx.fillStyle = color

  if (node.type === 'tiktok') {
    const pad = 3
    roundRect(ctx, x - node.radius - pad, y - node.radius - pad, (node.radius + pad) * 2, (node.radius + pad) * 2, 7)
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.arc(x, y, node.radius + (node.type === 'reference' ? 6 : 4), 0, Math.PI * 2)
  ctx.fill()
}

// --- links -----------------------------------------------------------------

const LINK_BASE: Record<string, number> = {
  'project-city': 0.18,
  'city-tiktok': 0.14,
  'tiktok-ref': 0.1,
}

function endpointId(end: string | GraphNode | undefined): string {
  return typeof end === 'object' && end !== null ? end.id : String(end ?? '')
}

export function linkColor(link: GraphLink, state: PaintState): string {
  const base = LINK_BASE[link.kind] ?? 0.12
  if (!state.emphasis) return `rgba(255,255,255,${base})`

  const lit =
    state.emphasis.has(endpointId(link.source)) && state.emphasis.has(endpointId(link.target))
  return `rgba(255,255,255,${lit ? base * 2.4 : base * 0.18})`
}

export function linkWidth(link: GraphLink, state: PaintState): number {
  if (!state.emphasis) return link.kind === 'tiktok-ref' ? 0.6 : 1
  const lit =
    state.emphasis.has(endpointId(link.source)) && state.emphasis.has(endpointId(link.target))
  return lit ? 1.4 : 0.6
}
