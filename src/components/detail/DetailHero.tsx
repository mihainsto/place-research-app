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
        /* Mobile is height-driven, not ratio-driven: 125vw is the 4:5 height at
           full bleed, capped at 46vh so the script isn't a screen and a half
           down. Capping an aspect-ratio box instead would shrink its *width*
           too, pulling the image off the right edge. */
        className="-mx-5 h-[min(125vw,46vh)] md:mx-auto md:aspect-4/5 md:h-auto md:w-[min(100%,420px)] md:rounded-card md:border md:border-hairline"
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
