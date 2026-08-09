import type { Location } from '@/data/schema'
import { Section } from '@/components/ui/Section'
import { ExternalLinkButton } from '@/components/ui/ExternalLink'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Map buttons are full-width rows on mobile and sit low in the section —
 * thumb-reachable while you're holding a gimbal in the other hand.
 *
 * Apple Maps comes first: it works in mainland China, Google Maps does not.
 */
export function LocationSection({ location }: { location: Location | null }) {
  if (!location) {
    return (
      <Section label="Location">
        <EmptyState compact title="No location yet" description="Add a `location` to this entry and the map buttons appear here." />
      </Section>
    )
  }

  return (
    <Section label="Location">
      {location.name ? (
        <p className="text-[17px] leading-[24px] text-ink text-pretty">{location.name}</p>
      ) : null}

      {location.links.length > 0 ? (
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          {location.links.map((link) => (
            <ExternalLinkButton
              key={link.label}
              href={link.url}
              label={link.label}
              hint={link.derived ? 'search' : undefined}
            />
          ))}
        </div>
      ) : null}
    </Section>
  )
}
