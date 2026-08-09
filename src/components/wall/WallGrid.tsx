import { useEffect, useRef, useState } from 'react'
import type { TikTok } from '@/data/schema'
import { TikTokCard } from '@/components/wall/TikTokCard'

/**
 * A uniform 4:5 grid, not masonry.
 *
 * TikTok is a vertical medium, so a wall of same-shaped posters reads calmer
 * than a ragged column flow: aligned baselines, predictable reading order,
 * and crops that were chosen rather than accidental.
 * The aspect ratio is one class in TikTokCard if you ever want to change it.
 *
 * Scale: below PAGE_SIZE cards everything renders at once. Past that we grow
 * the list as you scroll — cheaper and far simpler than virtualising, and it
 * keeps ⌘F working on what you've already seen.
 */

const PAGE_SIZE = 120

export function WallGrid({ tiktoks }: { tiktoks: TikTok[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinel = useRef<HTMLDivElement | null>(null)

  // Reset paging whenever the filtered set changes.
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [tiktoks])

  useEffect(() => {
    const node = sentinel.current
    if (!node || visible >= tiktoks.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((n) => Math.min(n + PAGE_SIZE, tiktoks.length))
        }
      },
      { rootMargin: '1200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, tiktoks.length])

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 min-[480px]:gap-x-4 md:grid-cols-3 md:gap-x-5 md:gap-y-9 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 2xl:grid-cols-5">
        {tiktoks.slice(0, visible).map((tiktok, i) => (
          <TikTokCard key={tiktok.id} tiktok={tiktok} eager={i < 10} />
        ))}
      </div>
      {visible < tiktoks.length ? <div ref={sentinel} aria-hidden className="h-px" /> : null}
    </>
  )
}
