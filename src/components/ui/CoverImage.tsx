import { useState } from 'react'
import { assetUrl } from '@/lib/asset'
import { cn } from '@/lib/cn'

interface Props {
  src: string | null
  alt: string
  /** Drives the placeholder monogram when there is no usable image. */
  fallbackText?: string
  className?: string
  imgClassName?: string
  /** First screenful of the Wall — skip lazy loading so it paints instantly. */
  eager?: boolean
  sizes?: string
}

/**
 * A cover that never breaks the layout.
 *
 * Missing image, 404, blocked CDN — all land on the same designed placeholder
 * (a monogram of the title), never a broken-image glyph and never a collapsed
 * card. In China, "the CDN is blocked" is a normal Tuesday.
 */
export function CoverImage({
  src,
  alt,
  fallbackText,
  className,
  imgClassName,
  eager = false,
  sizes,
}: Props) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error')

  const resolved = assetUrl(src)
  const showImage = resolved && state !== 'error'
  const monogram = (fallbackText ?? alt).trim().charAt(0).toUpperCase() || '·'

  return (
    <div className={cn('@container relative overflow-hidden bg-surface', className)}>
      {/* Placeholder sits underneath — it is what you see while loading and
          what remains if the image never arrives. */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 grid place-items-center transition-opacity duration-300 ease-snappy',
          state === 'loaded' ? 'opacity-0' : 'opacity-100',
        )}
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 60%), var(--color-surface)',
        }}
      >
        <span className="text-[clamp(2rem,22cqw,5rem)] font-semibold text-white/[0.06] select-none">
          {monogram}
        </span>
      </div>

      {showImage ? (
        <img
          src={resolved}
          alt={alt}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={cn(
            'relative size-full object-cover transition-opacity duration-300 ease-snappy',
            state === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      ) : null}
    </div>
  )
}
