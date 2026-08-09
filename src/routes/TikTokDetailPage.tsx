import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCity, useData, useTikTok } from '@/data/DataContext'
import { DetailHero } from '@/components/detail/DetailHero'
import { LocationSection } from '@/components/detail/LocationSection'
import { ReferencesSection } from '@/components/detail/ReferencesSection'
import { ScriptSection, useWakeLock } from '@/components/detail/ScriptSection'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * A real page, not a modal: shareable, back-button-correct, printable, and —
 * the part that actually matters — sane on a phone with 800 words of script
 * on it.
 *
 * Order is fixed and shallow: cover → title → location → references → script.
 * Nothing behind a tab, nothing behind a "read more".
 */
export function TikTokDetailPage() {
  const { id } = useParams()
  const { dataset } = useData()
  const tiktok = useTikTok(id)
  const city = useCity(tiktok?.cityId)

  useWakeLock(Boolean(tiktok?.script))

  if (!tiktok) {
    return (
      <div className="page pt-10 pb-24">
        <EmptyState
          title="No TikTok with that id"
          description={`Nothing in ${dataset.projectName} matches "${id}". Ids are permanent — if one was renamed in the JSON, old links break.`}
          action={
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
            >
              Back to the Wall
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-20 bg-canvas/90 backdrop-blur-xl md:static md:bg-transparent md:backdrop-blur-none">
        {/* Padding is only dropped at lg, where the 680px column already has
            slack beside the sidebar. Between md and lg (an iPad in portrait)
            dropping it would run the text into both edges. */}
        <div className="mx-auto w-full max-w-[680px] px-5 pt-[var(--safe-t)] md:px-8 md:pt-8 lg:px-0">
          <Link
            to="/"
            className="inline-flex h-12 items-center gap-1.5 text-[14px] leading-5 font-medium text-ink-2 transition-colors duration-150 hover:text-ink md:h-auto"
          >
            <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
            Wall
          </Link>
        </div>
      </div>

      <article className="mx-auto w-full max-w-[680px] px-5 pb-[calc(80px+var(--safe-b))] md:px-8 md:pt-6 md:pb-32 lg:px-0">
        <DetailHero tiktok={tiktok} city={city} />
        <LocationSection location={tiktok.location} />
        <ReferencesSection references={tiktok.references} />
        <ScriptSection script={tiktok.script} />
      </article>
    </>
  )
}
