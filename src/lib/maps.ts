import type { MapLink } from '@/data/schema'
import { parseUrl } from '@/lib/references'

/**
 * Map links.
 *
 * If the JSON supplies a URL we use it verbatim. If it doesn't, we synthesise
 * a search URL from the location name + city — so a location with nothing but
 * a name is still tappable in the field.
 *
 * Amap (高德地图) is included because Google Maps does not work in mainland
 * China without a VPN, which is exactly where this app gets used.
 */

export function appleMapsSearch(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`
}

export function googleMapsSearch(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function amapSearch(query: string): string {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}`
}

interface BuildArgs {
  locationName: string
  cityName: string
  appleMapsUrl?: string
  googleMapsUrl?: string
  amapUrl?: string
}

export function buildMapLinks({
  locationName,
  cityName,
  appleMapsUrl,
  googleMapsUrl,
  amapUrl,
}: BuildArgs): MapLink[] {
  const query = [locationName, cityName].filter(Boolean).join(', ').trim()
  const canDerive = query.length > 0

  const links: MapLink[] = []

  const push = (
    label: MapLink['label'],
    supplied: string | undefined,
    derive: (q: string) => string,
  ) => {
    const clean = supplied?.trim()
    if (clean && parseUrl(clean)) {
      links.push({ label, url: clean, derived: false })
    } else if (canDerive) {
      links.push({ label, url: derive(query), derived: true })
    }
  }

  push('Apple Maps', appleMapsUrl, appleMapsSearch)
  push('Google Maps', googleMapsUrl, googleMapsSearch)

  // Amap only appears when explicitly provided — deriving it for every
  // location would add a third button most entries don't need.
  const amap = amapUrl?.trim()
  if (amap && parseUrl(amap)) links.push({ label: 'Amap 高德', url: amap, derived: false })

  return links
}
