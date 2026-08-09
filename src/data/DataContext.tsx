import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildIndex, type DataIndex } from '@/data/indexes'
import { loadDataset } from '@/data/load'
import type { City, Dataset, TikTok } from '@/data/schema'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; dataset: Dataset; index: DataIndex }

const DataContext = createContext<State | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    loadDataset(controller.signal)
      .then((dataset) => {
        if (controller.signal.aborted) return
        setState({ status: 'ready', dataset, index: buildIndex(dataset) })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error loading data.',
        })
      })

    return () => controller.abort()
  }, [])

  return <DataContext value={state}>{children}</DataContext>
}

function useDataState(): State {
  const state = use(DataContext)
  if (!state) throw new Error('useData* must be used inside <DataProvider>')
  return state
}

export function useDataStatus(): State {
  return useDataState()
}

/**
 * For components rendered below the loading gate, where data is guaranteed.
 */
export function useData(): { dataset: Dataset; index: DataIndex } {
  const state = useDataState()
  if (state.status !== 'ready') {
    throw new Error('useData() called before the dataset was ready')
  }
  return { dataset: state.dataset, index: state.index }
}

export function useTikTok(id: string | undefined): TikTok | undefined {
  const { index } = useData()
  return id ? index.byId.get(id) : undefined
}

export function useCity(id: string | undefined): City | undefined {
  const { index } = useData()
  return id ? index.cityById.get(id) : undefined
}

/** Cities that actually have TikToks, ordered by volume then name. */
export function useCitiesWithCounts(): { city: City; count: number }[] {
  const { dataset, index } = useData()
  return useMemo(
    () =>
      dataset.cities
        .map((city) => ({ city, count: index.counts.byCity.get(city.id) ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count || a.city.name.localeCompare(b.city.name)),
    [dataset, index],
  )
}
