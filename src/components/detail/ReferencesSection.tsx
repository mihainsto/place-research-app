import type { Reference } from '@/data/schema'
import { referenceLabel } from '@/lib/references'
import { Section } from '@/components/ui/Section'
import { ExternalLinkRow } from '@/components/ui/ExternalLink'
import { EmptyState } from '@/components/ui/EmptyState'

export function ReferencesSection({ references }: { references: Reference[] }) {
  if (references.length === 0) {
    return (
      <Section label="References">
        <EmptyState
          compact
          title="No references"
          description="Add sources to `references` and they show up here as external links."
        />
      </Section>
    )
  }

  return (
    <Section label="References" aside={<span className="text-[12px] tabular-nums text-ink-3">{references.length}</span>}>
      <div className="flex flex-col gap-2.5">
        {references.map((reference) => (
          <ExternalLinkRow
            key={reference.id}
            href={reference.url}
            title={reference.title}
            hostname={reference.hostname}
            meta={referenceLabel(reference.url, reference.type)}
          />
        ))}
      </div>
    </Section>
  )
}
