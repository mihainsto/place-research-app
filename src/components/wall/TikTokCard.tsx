import { Link } from 'react-router-dom'
import type { TikTok } from '@/data/schema'
import { STATUS_COLOR } from '@/lib/constants'
import { CoverImage } from '@/components/ui/CoverImage'
import { CategoryTag, PriorityTag } from '@/components/ui/Tag'

interface Props {
  tiktok: TikTok
  eager?: boolean
}

/**
 * Four pieces of information and nothing else: cover, title, priority,
 * category.
 *
 * Status is present but recessive — a 2px hairline along the bottom of the
 * cover. You can read the production state of the whole Wall at a glance
 * without status ever competing with the image.
 * City is deliberately absent: the Wall is usually already filtered by city,
 * and the title almost always carries it.
 */
export function TikTokCard({ tiktok, eager }: Props) {
  const mustFilm = tiktok.priority === 'Must Film'

  return (
    <Link
      to={`/t/${tiktok.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`${tiktok.title} — ${tiktok.priority}${tiktok.category ? `, ${tiktok.category}` : ''}`}
    >
      <div
        className="relative overflow-hidden rounded-card bg-surface transition-[box-shadow,transform] duration-200 ease-snappy group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-canvas"
        style={{
          boxShadow: mustFilm
            ? 'inset 0 0 0 1px var(--color-accent-line)'
            : 'inset 0 0 0 1px var(--color-hairline)',
        }}
      >
        <CoverImage
          src={tiktok.coverImage}
          alt=""
          fallbackText={tiktok.title}
          className="aspect-4/5 w-full"
          imgClassName="transition-transform duration-[400ms] ease-snappy group-hover:scale-[1.035]"
          eager={eager}
          sizes="(max-width: 479px) 50vw, (max-width: 767px) 45vw, (max-width: 1023px) 31vw, (max-width: 1535px) 23vw, 19vw"
        />

        {/* Scrim: keeps the bottom edge from fighting the status line and
            deepens slightly on hover. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-70 transition-opacity duration-200 ease-snappy group-hover:opacity-100"
          style={{
            background: 'linear-gradient(to top, rgba(8,9,10,0.55), rgba(8,9,10,0))',
          }}
        />

        {/* Status: present, never dominant. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ backgroundColor: STATUS_COLOR[tiktok.status], opacity: 0.85 }}
        />
      </div>

      <div className="mt-3 px-0.5">
        <h3 className="line-clamp-2 text-[15px] leading-[20px] font-semibold tracking-[-0.01em] text-ink transition-colors duration-150 group-hover:text-white md:text-[16px] md:leading-[21px]">
          {tiktok.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <PriorityTag priority={tiktok.priority} />
          <CategoryTag category={tiktok.category} />
        </div>
      </div>
    </Link>
  )
}
