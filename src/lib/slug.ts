/**
 * Stable, URL-safe ids.
 *
 * Ids are permalinks (`/t/chongqing-diarrhea-clinic`), so this must be
 * deterministic: the same input always produces the same slug, forever.
 */

export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '')

  // Non-Latin input (e.g. 重庆) slugifies to nothing — fall back to a stable
  // hash so the entry still gets a usable, permanent id.
  if (base) return base
  return `x-${hash(input)}`
}

function hash(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/** Ensures uniqueness within a run by appending `-2`, `-3`, … */
export function uniqueSlug(candidate: string, taken: Set<string>): string {
  if (!taken.has(candidate)) {
    taken.add(candidate)
    return candidate
  }
  let n = 2
  while (taken.has(`${candidate}-${n}`)) n++
  const result = `${candidate}-${n}`
  taken.add(result)
  return result
}
