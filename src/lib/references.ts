import type { ReferenceType } from '@/lib/constants'

/**
 * Reference type + display label are DERIVED from the URL.
 * The LLM may set `type` explicitly, but it never has to — one less field it
 * can get wrong, and one guarantee that labelling stays consistent.
 */

export function parseUrl(url: string): URL | null {
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u
  } catch {
    return null
  }
}

export function hostnameOf(url: string): string {
  return parseUrl(url)?.hostname.replace(/^www\./, '') ?? ''
}

export function deriveReferenceType(url: string): ReferenceType {
  const u = parseUrl(url)
  if (!u) return 'website'
  const host = u.hostname.replace(/^www\./, '').toLowerCase()

  if (host.endsWith('instagram.com')) return 'instagram'
  if (host.endsWith('tiktok.com') || host.endsWith('douyin.com')) return 'tiktok'
  if (host.endsWith('youtube.com') || host === 'youtu.be') return 'youtube'
  if (host.endsWith('xiaohongshu.com') || host.endsWith('xhslink.com')) return 'xiaohongshu'
  if (host.endsWith('vimeo.com') || host.endsWith('bilibili.com')) return 'video'
  return 'website'
}

/**
 * Human label shown on the right of a reference row — "Instagram Reel",
 * "YouTube Short", "Article". Specific where the URL lets us be specific.
 */
export function referenceLabel(url: string, type: ReferenceType): string {
  const u = parseUrl(url)
  const path = u?.pathname.toLowerCase() ?? ''
  const host = u?.hostname.replace(/^www\./, '').toLowerCase() ?? ''

  switch (type) {
    case 'instagram':
      if (path.includes('/reel')) return 'Instagram Reel'
      if (path.includes('/p/')) return 'Instagram Post'
      return 'Instagram'
    case 'tiktok':
      return host.endsWith('douyin.com') ? 'Douyin' : 'TikTok'
    case 'youtube':
      return path.includes('/shorts') ? 'YouTube Short' : 'YouTube'
    case 'xiaohongshu':
      return '小红书 · RED'
    case 'video':
      if (host.endsWith('bilibili.com')) return 'Bilibili'
      if (host.endsWith('vimeo.com')) return 'Vimeo'
      return 'Video'
    case 'article':
      return 'Article'
    case 'website':
    default:
      return 'Website'
  }
}

/** Fallback title when the reference has none — never show a bare URL. */
export function fallbackReferenceTitle(url: string, type: ReferenceType): string {
  const host = hostnameOf(url)
  const label = referenceLabel(url, type)
  if (host && label === 'Website') return host
  return label
}
