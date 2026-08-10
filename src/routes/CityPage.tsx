import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCity, useData } from '@/data/DataContext'
import { STATUSES, STATUS_COLOR } from '@/lib/constants'
import { sortTikToks } from '@/lib/filters'
import { formatSpan } from '@/lib/timeline'
import { WallGrid } from '@/components/wall/WallGrid'
import { EmptyState } from '@/components/ui/EmptyState'

export function CityPage() {
  const { cityId } = useParams()
  const { dataset, index } = useData()
  const city = useCity(cityId)

  // Cross-link to the trip: how many days land here, and when.
  const scheduled = useMemo(() => {
    const days = dataset.timeline.filter((d) => d.cityId === cityId)
    if (days.length === 0) return null
    return { days: days.length, span: formatSpan(days[0].date, days[days.length - 1].date) }
  }, [dataset.timeline, cityId])

  const tiktoks = useMemo(() => {
    const list = cityId ? (index.byCity.get(cityId) ?? []) : []
    return sortTikToks(list, 'priority', () => '')
  }, [cityId, index.byCity])

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tiktoks) counts.set(t.status, (counts.get(t.status) ?? 0) + 1)
    return counts
  }, [tiktoks])

  if (!city) {
    return (
      <div className="page pt-10 pb-24">
        <EmptyState
          title="No such city"
          description={`Nothing matches "${cityId}".`}
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

  const mustFilm = tiktoks.filter((t) => t.priority === 'Must Film').length

  return (
    <div className="page pt-6 pb-[calc(72px+var(--safe-b))] md:pt-12 md:pb-24">
      <header className="pb-8 md:pb-10">
        {city.region ? <p className="label-micro pb-2">{city.region}</p> : null}
        <h1 className="text-[32px] leading-[37px] font-semibold tracking-[-0.022em] text-ink md:text-[40px] md:leading-[45px]">
          {city.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] leading-[18px] text-ink-3">
          <span>
            {tiktoks.length} TikTok{tiktoks.length === 1 ? '' : 's'}
          </span>
          {mustFilm > 0 ? <span style={{ color: '#f0655a' }}>{mustFilm} must film</span> : null}
          {STATUSES.filter((s) => statusCounts.has(s)).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-[5px] rounded-full"
                style={{ backgroundColor: STATUS_COLOR[status] }}
              />
              {statusCounts.get(status)} {status.toLowerCase()}
            </span>
          ))}
        </div>

        {scheduled ? (
          <p className="mt-3 text-[13px] leading-[18px] text-ink-2">
            <Link to="/timeline" className="underline decoration-hairline-strong underline-offset-2 transition-colors hover:decoration-ink-2">
              {scheduled.days} day{scheduled.days === 1 ? '' : 's'} scheduled
            </Link>
            <span className="text-ink-3"> · {scheduled.span}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            to={`/?city=${city.id}`}
            className="inline-flex h-9 items-center rounded-card border border-hairline bg-surface px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          >
            Filter the Wall
          </Link>
          <Link
            to={`/graph?focus=city:${city.id}`}
            className="inline-flex h-9 items-center rounded-card border border-hairline bg-surface px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-raised hover:text-ink"
          >
            Show in Graph
          </Link>
        </div>
      </header>

      {tiktoks.length === 0 ? (
        <EmptyState title="Nothing here yet" description={`No TikToks are assigned to ${city.name}.`} />
      ) : (
        <WallGrid tiktoks={tiktoks} />
      )}
    </div>
  )
}
