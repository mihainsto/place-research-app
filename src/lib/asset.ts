/**
 * Resolve a stored asset path against the deployment's base path.
 *
 * The data file stores covers root-relative (`/covers/foo.jpg`) because that's
 * what's natural to write and what `normalize.ts` produces — and `normalize.ts`
 * is shared with the Node validator, where `import.meta.env` doesn't exist.
 *
 * So the base is applied here, at render time. Without it every local cover
 * 404s the moment the app is served from a subpath (GitHub Pages), and the
 * whole board silently degrades to monogram tiles — silently, because a
 * missing cover is a *designed* state and looks entirely deliberate.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}
