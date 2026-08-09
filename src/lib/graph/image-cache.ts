/**
 * Cover images for graph nodes.
 *
 * Module-level cache, so an image is decoded once per session no matter how
 * many times it's painted (which, at 60fps, is a lot). Loads are queued a few
 * at a time and requested in paint order, so whatever is on screen decodes
 * first — that matters at 200 covers.
 *
 * No `crossOrigin`: we only ever draw these, never read pixels back, so a
 * tainted canvas costs us nothing and CORS can't break the map.
 */

import { assetUrl } from '@/lib/asset'

type State = 'queued' | 'loading' | 'ready' | 'error'

interface Entry {
  img: HTMLImageElement
  state: State
}

const MAX_CONCURRENT = 6

const entries = new Map<string, Entry>()
const queue: string[] = []
let active = 0

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const src = queue.shift()
    if (!src) continue
    const entry = entries.get(src)
    if (!entry || entry.state !== 'queued') continue

    entry.state = 'loading'
    active += 1

    const done = (state: State) => () => {
      entry.state = state
      active -= 1
      pump()
    }

    entry.img.addEventListener('load', done('ready'), { once: true })
    entry.img.addEventListener('error', done('error'), { once: true })
    entry.img.decoding = 'async'
    entry.img.src = src
  }
}

/**
 * Returns the decoded image, or null while it's still loading / if it failed.
 * Callers paint a placeholder when they get null — never a gap.
 */
export function getCoverImage(rawSrc: string | null | undefined): HTMLImageElement | null {
  // Stored paths are root-relative; resolve against the deployment base or
  // every cover 404s when served from a subpath.
  const src = assetUrl(rawSrc)
  if (!src) return null

  const existing = entries.get(src)
  if (existing) return existing.state === 'ready' ? existing.img : null

  const entry: Entry = { img: new Image(), state: 'queued' }
  entries.set(src, entry)
  queue.push(src)
  pump()
  return null
}
