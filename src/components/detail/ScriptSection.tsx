import { useCallback, useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { Minus, Plus } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'

/**
 * The payload.
 *
 * Markdown, because that is how an LLM writes by reflex — a script full of
 * literal asterisks would be a worse read. Plain text still renders perfectly.
 * Sanitised because the content is machine-generated; it costs nothing.
 *
 * The only UI here is a text-size control, because the difference between 18px
 * and 22px matters when the phone is at arm's length in daylight.
 */

const SIZES = [17, 19, 21, 24] as const
const STORAGE_KEY = 'china2026:script-size'
const DEFAULT_INDEX = 1

function useScriptSize() {
  const [level, setLevel] = useState<number>(() => {
    if (typeof localStorage === 'undefined') return DEFAULT_INDEX
    const stored = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isInteger(stored) && stored >= 0 && stored < SIZES.length ? stored : DEFAULT_INDEX
  })

  const set = useCallback((next: number) => {
    const clamped = Math.min(SIZES.length - 1, Math.max(0, next))
    setLevel(clamped)
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped))
    } catch {
      // Private mode — the size just won't persist. Not worth surfacing.
    }
  }, [])

  return { level, set, size: SIZES[level] }
}

export function ScriptSection({ script }: { script: string }) {
  const { level, set, size } = useScriptSize()

  if (!script) {
    return (
      <Section label="Script">
        <EmptyState
          compact
          title="No script yet"
          description="Everything — hook, beats, shot notes, voiceover, captions — goes in the `script` field."
        />
      </Section>
    )
  }

  return (
    <Section
      label="Script"
      aside={
        <div className="flex items-center gap-0.5">
          <SizeButton label="Smaller text" disabled={level === 0} onClick={() => set(level - 1)}>
            <Minus aria-hidden className="size-3.5" strokeWidth={2.5} />
          </SizeButton>
          <SizeButton
            label="Larger text"
            disabled={level === SIZES.length - 1}
            onClick={() => set(level + 1)}
          >
            <Plus aria-hidden className="size-3.5" strokeWidth={2.5} />
          </SizeButton>
        </div>
      }
    >
      <div className="prose-script" style={{ ['--script-size' as string]: `${size}px` }}>
        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {script}
        </Markdown>
      </div>
    </Section>
  )
}

function SizeButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'grid size-7 place-items-center rounded-[7px] transition-colors duration-150',
        disabled ? 'text-ink-3/40' : 'text-ink-3 hover:bg-overlay hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/**
 * Keeps the screen awake while a script is open. Standing in a street reading
 * beats, the last thing you want is the display sleeping every 30 seconds.
 * Silently does nothing where unsupported or refused.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel = lock
      } catch {
        // Denied, low battery, or not visible. Nothing to do.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel?.release().catch(() => {})
    }
  }, [active])
}
