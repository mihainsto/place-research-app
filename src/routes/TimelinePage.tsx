import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TrainFront } from 'lucide-react'
import { useData } from '@/data/DataContext'
import type { TikTok } from '@/data/schema'
import { PRIORITY_RANK, STATUS_COLOR } from '@/lib/constants'
import {
  buildLegs,
  dayOfMonth,
  formatDuration,
  formatSpan,
  formatTimeRange,
  monthShort,
  weekday,
  type Leg,
} from '@/lib/timeline'
import { CoverImage } from '@/components/ui/CoverImage'
import { PriorityTag } from '@/components/ui/Tag'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

/**
 * The trip as a shooting schedule.
 *
 * A bare itinerary would be a list of dates — the app already knows which
 * TikToks are in which city, so each leg carries its own shot list. The two
 * things worth surfacing that a calendar can't: cities you have material for
 * but no days in, and days in a city with nothing on the board yet.
 */
export function TimelinePage() {
  const { dataset, index } = useData()

  const legs = useMemo(() => buildLegs(dataset.timeline), [dataset.timeline])

  const unscheduled = useMemo(
    () =>
      dataset.cities.filter(
        (city) =>
          (index.counts.byCity.get(city.id) ?? 0) > 0 && (index.daysByCity.get(city.id) ?? 0) === 0,
      ),
    [dataset.cities, index],
  )

  if (dataset.timeline.length === 0) {
    return (
      <div className="page pt-6 pb-[calc(72px+var(--safe-b))] md:pt-12 md:pb-24">
        <EmptyState
          title="No trip planned yet"
          description="Add a `timeline` array to the JSON — one entry per day, each with a date and a cityId — and the schedule builds itself from the board."
        />
      </div>
    )
  }

  const first = dataset.timeline[0].date
  const last = dataset.timeline[dataset.timeline.length - 1].date
  const citiesVisited = new Set(dataset.timeline.map((d) => d.cityId)).size
  const inReach = dataset.timeline.reduce(
    (set, day) => {
      for (const t of index.byCity.get(day.cityId) ?? []) set.add(t.id)
      return set
    },
    new Set<string>(),
  )
  const mustFilmInReach = [...inReach].filter(
    (id) => index.byId.get(id)?.priority === 'Must Film',
  ).length
  const trainDays = dataset.timeline.filter((day) => day.train).length

  return (
    // A single reading column: stretched full width the shot rows turn into a
    // table, with the priority tag stranded out on the far right.
    <div className="page mx-auto w-full max-w-[820px] pt-6 pb-[calc(72px+var(--safe-b))] md:pt-12 md:pb-32">
      <header className="pb-9 md:pb-12">
        <p className="label-micro pb-2">Timeline</p>
        <h1 className="text-[32px] leading-[37px] font-semibold tracking-[-0.022em] text-ink md:text-[40px] md:leading-[45px]">
          {formatSpan(first, last)}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] leading-[18px] text-ink-3">
          <span>
            {dataset.timeline.length} day{dataset.timeline.length === 1 ? '' : 's'}
          </span>
          <span>
            {citiesVisited} cit{citiesVisited === 1 ? 'y' : 'ies'}
          </span>
          <span>{inReach.size} TikToks in reach</span>
          {trainDays > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-accent-text">
              <TrainFront aria-hidden className="size-3.5" strokeWidth={1.8} />
              {trainDays} train day{trainDays === 1 ? '' : 's'}
            </span>
          ) : null}
          {mustFilmInReach > 0 ? (
            <span style={{ color: '#f0655a' }}>{mustFilmInReach} must film</span>
          ) : null}
        </div>

        {unscheduled.length > 0 ? (
          <p className="mt-5 rounded-card border border-hairline bg-surface px-4 py-3 text-[13px] leading-[19px] text-ink-2">
            <span className="text-ink">No days scheduled in </span>
            {unscheduled.map((city, i) => (
              <span key={city.id}>
                <Link to={`/city/${city.id}`} className="text-ink underline decoration-accent-line underline-offset-2 hover:decoration-accent">
                  {city.name}
                </Link>
                {i < unscheduled.length - 1 ? ', ' : ''}
              </span>
            ))}
            <span className="text-ink-3">
              {' '}
              — {unscheduled.reduce((n, c) => n + (index.counts.byCity.get(c.id) ?? 0), 0)} TikToks
              there with nowhere to shoot them.
            </span>
          </p>
        ) : null}
      </header>

      <ol className="flex flex-col">
        {legs.map((leg, i) => (
          <LegRow key={`${leg.cityId}-${leg.days[0].date}`} leg={leg} last={i === legs.length - 1} />
        ))}
      </ol>
    </div>
  )
}

function LegRow({ leg, last }: { leg: Leg; last: boolean }) {
  const { index } = useData()
  const city = index.cityById.get(leg.cityId)
  const start = leg.days[0]
  const end = leg.days[leg.days.length - 1]

  const tiktoks = useMemo(() => {
    const list = [...(index.byCity.get(leg.cityId) ?? [])]
    return list.sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.title.localeCompare(b.title),
    )
  }, [index.byCity, leg.cityId])

  const mustFilm = tiktoks.filter((t) => t.priority === 'Must Film').length
  const trainDays = leg.days.filter((day) => day.train)
  const notes = leg.days.filter((d) => d.note)

  return (
    <li className="flex gap-4 md:gap-7">
      {/* Date rail */}
      <div className="relative flex w-[52px] shrink-0 flex-col items-center md:w-[72px]">
        <div className="pt-0.5 text-center">
          <div className="label-micro">{weekday(start.date)}</div>
          <div className="mt-0.5 text-[19px] leading-[22px] font-semibold tabular-nums text-ink md:text-[22px] md:leading-[25px]">
            {dayOfMonth(start.date)}
          </div>
          {leg.days.length > 1 ? (
            <>
              <div className="mx-auto my-1.5 h-3 w-px bg-hairline-strong" />
              <div className="label-micro">{weekday(end.date)}</div>
              <div className="mt-0.5 text-[19px] leading-[22px] font-semibold tabular-nums text-ink md:text-[22px] md:leading-[25px]">
                {dayOfMonth(end.date)}
              </div>
            </>
          ) : null}
          <div className="mt-1 text-[11px] leading-[14px] text-ink-3 uppercase">
            {monthShort(start.date)}
          </div>
        </div>
        {/* Connector down to the next leg. */}
        {!last ? <div className="mt-3 w-px flex-1 bg-hairline" /> : null}
      </div>

      {/* Leg body */}
      <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-10 md:pb-14')}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-[22px] leading-[27px] font-semibold tracking-[-0.018em] text-ink md:text-[26px] md:leading-[31px]">
            {city ? (
              <Link to={`/city/${city.id}`} className="transition-colors hover:text-white">
                {city.name}
              </Link>
            ) : (
              leg.cityId
            )}
          </h2>
          <span className="text-[13px] text-ink-3">
            {leg.days.length} day{leg.days.length === 1 ? '' : 's'}
            {tiktoks.length > 0 ? ` · ${tiktoks.length} on the board` : ''}
            {mustFilm > 0 ? ` · ${mustFilm} must film` : ''}
          </span>
        </div>

        {notes.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1">
            {notes.map((day) => (
              <li key={day.date} className="text-[13px] leading-[19px] text-ink-2">
                <span className="text-ink-3">{weekday(day.date)} {dayOfMonth(day.date)} — </span>
                {day.note}
              </li>
            ))}
          </ul>
        ) : null}

        {trainDays.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            {trainDays.map((day) => (
              <TrainDayRow key={day.date} day={day} />
            ))}
          </div>
        ) : null}

        {tiktoks.length === 0 ? (
          <p className="mt-4 text-[14px] leading-[20px] text-ink-3">
            Nothing on the board for {city?.name ?? leg.cityId} yet.
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-1.5">
            {tiktoks.map((tiktok) => (
              <ShotRow key={tiktok.id} tiktok={tiktok} />
            ))}
          </div>
        )}
      </div>
    </li>
  )
}

function TrainDayRow({ day }: { day: Leg['days'][number] }) {
  if (!day.train) return null

  return (
    <div className="flex items-start gap-3 rounded-card border border-hairline bg-surface px-3 py-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-accent-dim text-accent-text">
        <TrainFront aria-hidden className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-[14px] leading-[19px] font-medium text-ink">Train day</p>
          <p className="text-[12px] leading-4 text-ink-3">
            {weekday(day.date)} {dayOfMonth(day.date)} {monthShort(day.date)}
          </p>
        </div>
        <p className="mt-0.5 text-[12px] leading-[17px] text-ink-2">
          {formatTimeRange(day.train)}{' '}
          <span className="text-ink-3">
            · {formatDuration(day.train.durationMinutes)} travel · less filming time
          </span>
        </p>
      </div>
    </div>
  )
}

function ShotRow({ tiktok }: { tiktok: TikTok }) {
  return (
    <Link
      to={`/t/${tiktok.id}`}
      className="group flex items-center gap-3.5 rounded-card px-2 py-2 transition-colors duration-150 hover:bg-surface"
    >
      <CoverImage
        src={tiktok.coverImage}
        alt=""
        fallbackText={tiktok.title}
        className="aspect-4/5 w-9 shrink-0 rounded-[6px] border border-hairline md:w-10"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] leading-[21px] font-medium text-ink transition-colors group-hover:text-white">
          {tiktok.title}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[12px] leading-4 text-ink-3">
          <span
            aria-hidden
            className="size-[5px] shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_COLOR[tiktok.status] }}
          />
          {tiktok.status}
          {tiktok.category ? <span className="truncate">· {tiktok.category}</span> : null}
        </span>
      </span>
      <PriorityTag priority={tiktok.priority} className="shrink-0" />
    </Link>
  )
}
