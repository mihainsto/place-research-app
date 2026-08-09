import { Link } from 'react-router-dom'
import type { City, TikTok } from '@/data/schema'
import { CoverImage } from '@/components/ui/CoverImage'
import { CategoryTag, PriorityTag, StatusTag } from '@/components/ui/Tag'

export function DetailHero({ tiktok, city }: { tiktok: TikTok; city: City | undefined }) {
  return (
    <header>
      {/* Portrait at every size. These are vertical-video sources — a 3:2
          desktop hero cropped the subject out of most of them. On desktop the
          width is capped instead, so the frame sits centred in the column
          rather than filling it. */}
      <CoverImage
        src={tiktok.coverImage}
        alt=""
        fallbackText={tiktok.title}
        /* Capped on mobile: a full-height 4:5 hero pushes the script more than
           a screen down, and the script is why you opened this on your phone. */
        className="-mx-5 aspect-4/5 max-h-[46vh] md:mx-auto md:max-h-none md:w-[min(100%,420px)] md:rounded-card md:border md:border-hairline"
        eager
        sizes="(max-width: 767px) 100vw, 420px"
      />

      <h1 className="mt-7 text-[28px] leading-[33px] font-semibold tracking-[-0.022em] text-balance text-ink md:mt-8 md:text-[34px] md:leading-[39px]">
        {tiktok.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <PriorityTag priority={tiktok.priority} />
        <CategoryTag category={tiktok.category} />
        <StatusTag status={tiktok.status} />
      </div>

      {city ? (
        <Link
          to={`/city/${city.id}`}
          className="mt-5 inline-flex items-baseline gap-2 text-[17px] leading-[23px] font-medium text-ink-2 transition-colors duration-150 hover:text-ink"
        >
          {city.name}
          {city.region ? (
            <span className="text-[13px] font-normal text-ink-3">{city.region}</span>
          ) : null}
        </Link>
      ) : null}
    </header>
  )
}
