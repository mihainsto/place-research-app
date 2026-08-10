import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigationType } from 'react-router-dom'
import { useData } from '@/data/DataContext'
import { Sidebar } from '@/components/shell/Sidebar'
import { MobileTabBar } from '@/components/shell/MobileTabBar'
import { CommandPalette } from '@/components/shell/CommandPalette'

export function AppShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()
  const { dataset } = useData()

  // The detail page and the graph bring their own top chrome.
  const showMobileTopBar =
    pathname === '/' || pathname.startsWith('/city/') || pathname.startsWith('/timeline')

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-card focus:bg-raised focus:px-4 focus:py-2 focus:text-[14px] focus:text-ink"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="md:pl-sidebar">
        {showMobileTopBar ? (
          <div className="sticky top-0 z-20 border-b border-hairline bg-canvas/90 backdrop-blur-xl md:hidden">
            <div className="flex h-12 items-center px-5 pt-[var(--safe-t)]">
              <Link to="/" className="text-[15px] leading-5 font-semibold tracking-[-0.01em] text-ink">
                {dataset.projectName}
              </Link>
            </div>
          </div>
        ) : null}

        <main id="main">{children}</main>
      </div>

      <MobileTabBar onSearch={() => setPaletteOpen(true)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ScrollManager />
    </div>
  )
}

/**
 * Back from a TikTok should return you to the same spot on the Wall you left,
 * not the top of it. Forward navigation always starts at the top.
 */
function ScrollManager() {
  const { key, pathname } = useLocation()
  const navigationType = useNavigationType()
  const frame = useRef(0)

  useEffect(() => {
    if (navigationType === 'POP') {
      const saved = sessionStorage.getItem(`scroll:${key}`)
      if (saved !== null) {
        window.scrollTo(0, Number(saved))
        return
      }
    }
    window.scrollTo(0, 0)
  }, [key, pathname, navigationType])

  useEffect(() => {
    const save = () => sessionStorage.setItem(`scroll:${key}`, String(window.scrollY))

    const onScroll = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(save)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame.current)
      save()
      window.removeEventListener('scroll', onScroll)
    }
  }, [key])

  return null
}
