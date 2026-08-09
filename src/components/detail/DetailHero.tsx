import { Link } from 'react-router-dom'
import type { City, TikTok } from '@/data/schema'
import { CoverImage } from '@/components/ui/CoverImage'
import { CategoryTag, PriorityTag, StatusTag } from '@/components/ui/Tag'

export function DetailHero({ tiktok, city }: { tiktok: TikTok; city: City | undefined }) {
  return (
    <header>
      {/* Full-bleed on mobile, framed on desktop. Same image, two crops. */}
      <CoverImage
        src={tiktok.coverImage}
        alt=""
        fallbackText={tiktok.title}
        /* Capped on mobile: a full 4:5 hero pushes the script more than a
           screen down, and the script is why you opened this on your phone. */
        className="-mx-5 aspect-4/5 max-h-[46vh] md:mx-0 md:aspect-3/2 md:max-h-none md:rounded-card md:border md:border-hairline"
        eager
        sizes="(max-width: 767px) 100vw, 680px"
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
