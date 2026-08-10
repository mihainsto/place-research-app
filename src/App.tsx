import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DataProvider, useDataStatus } from '@/data/DataContext'
import { AppShell } from '@/components/shell/AppShell'
import { WallPage } from '@/routes/WallPage'
import { TimelinePage } from '@/routes/TimelinePage'
import { CityPage } from '@/routes/CityPage'
import { NotFound } from '@/routes/NotFound'

/**
 * Both heavy views are split out of the Wall's critical path: the graph engine
 * (~64KB gz) and the markdown renderer the script uses (~48KB gz). The Wall is
 * the first thing that paints on a foreign SIM, so it should carry neither.
 *
 * Neither split costs anything in the field — the service worker precaches
 * every chunk, so by the time you're standing in the street they're local.
 */
const GraphPage = lazy(() => import('@/routes/GraphPage').then((m) => ({ default: m.GraphPage })))
const TikTokDetailPage = lazy(() =>
  import('@/routes/TikTokDetailPage').then((m) => ({ default: m.TikTokDetailPage })),
)

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DataProvider>
        <DataGate>
          <AppShell>
            <Routes>
              <Route path="/" element={<WallPage />} />
              <Route
                path="/t/:id"
                element={
                  <Suspense fallback={<div className="min-h-dvh" />}>
                    <TikTokDetailPage />
                  </Suspense>
                }
              />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/city/:cityId" element={<CityPage />} />
              <Route
                path="/graph"
                element={
                  <Suspense fallback={<GraphFallback />}>
                    <GraphPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </DataGate>
      </DataProvider>
    </BrowserRouter>
  )
}

/**
 * Nothing renders until the dataset is in memory. It is one small fetch, and
 * gating on it means no component anywhere has to handle a missing dataset.
 */
function DataGate({ children }: { children: React.ReactNode }) {
  const state = useDataStatus()

  if (state.status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span className="sr-only">Loading</span>
        <div className="h-px w-24 overflow-hidden bg-hairline">
          <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-ink-3" />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-[46ch] text-center">
          <p className="text-[17px] leading-6 font-medium text-ink">Couldn't load the data</p>
          <p className="mt-2.5 text-[14px] leading-[21px] text-ink-2">{state.error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 h-9 rounded-card border border-hairline bg-surface px-4 text-[14px] font-medium text-ink transition-colors hover:bg-raised"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function GraphFallback() {
  return (
    <div className="grid h-[calc(100dvh-52px-var(--safe-b))] place-items-center md:h-dvh">
      <span className="text-[13px] text-ink-3">Building the map…</span>
    </div>
  )
}
