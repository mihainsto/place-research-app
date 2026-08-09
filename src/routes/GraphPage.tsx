import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '@/data/DataContext'
import {
  buildGraphModel,
  computeEmphasis,
  selectVisible,
  type GraphNode,
} from '@/lib/graph/model'
import type { PaintState } from '@/lib/graph/paint'
import { useIsMobile, usePrefersReducedMotion } from '@/lib/useMediaQuery'
import { GraphCanvas, type FGMethods } from '@/components/graph/GraphCanvas'
import { GraphControls, GraphLegend, GraphSearch } from '@/components/graph/GraphControls'
import { NodeInspector } from '@/components/graph/NodeInspector'
import { EmptyState } from '@/components/ui/EmptyState'

/**
 * Beyond this many TikToks the map starts collapsed — cities only, expand
 * what you're interested in. Below it, everything is on screen at once.
 */
const COLLAPSE_THRESHOLD = 150

export function GraphPage() {
  const { dataset, index } = useData()
  const [params, setParams] = useSearchParams()
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()

  const fgRef = useRef<FGMethods | undefined>(undefined)
  /**
   * The map re-frames itself every time the layout settles — until you touch
   * it. After that it stays exactly where you put it.
   */
  const userInteracted = useRef(false)

  const model = useMemo(() => buildGraphModel(dataset, index), [dataset, index])

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showReferences, setShowReferences] = useState(false)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())

  const canCollapse = isMobile || model.tiktoks.length > COLLAPSE_THRESHOLD
  const [expandAll, setExpandAll] = useState(!canCollapse)

  // Keep the default honest if the viewport or dataset changes under us.
  useEffect(() => {
    setExpandAll(!(isMobile || model.tiktoks.length > COLLAPSE_THRESHOLD))
  }, [isMobile, model.tiktoks.length])

  const selectedId = params.get('focus')
  const selected = selectedId ? model.byId.get(selectedId) : undefined

  const setSelected = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params)
      if (id) next.set('focus', id)
      else next.delete('focus')
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  // --- search ---------------------------------------------------------------
  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    const matches = new Set<string>()
    for (const node of model.tiktoks) {
      if (node.tiktok?.searchText.includes(q)) matches.add(node.id)
    }
    for (const node of model.cities) {
      if (node.label.toLowerCase().includes(q)) {
        matches.add(node.id)
        for (const t of model.tiktoksByCity.get(node.cityId ?? '') ?? []) matches.add(t.id)
      }
    }
    return matches
  }, [query, model])

  // --- visible slice --------------------------------------------------------
  const data = useMemo(
    () =>
      selectVisible(model, {
        expandAll: expandAll || Boolean(searchMatches),
        expandedCities,
        showReferences,
        selectedId,
      }),
    [model, expandAll, expandedCities, showReferences, selectedId, searchMatches],
  )

  const emphasis = useMemo(
    () => computeEmphasis(model, selectedId, searchMatches),
    [model, selectedId, searchMatches],
  )

  const paintState: PaintState = useMemo(
    () => ({ emphasis, selectedId, hoveredId, reducedMotion }),
    [emphasis, selectedId, hoveredId, reducedMotion],
  )

  // --- camera ---------------------------------------------------------------
  const focusOn = useCallback(
    (node: GraphNode, minZoom = 1.1) => {
      const fg = fgRef.current
      if (!fg) return
      const duration = reducedMotion ? 0 : 600
      fg.centerAt(node.x ?? 0, node.y ?? 0, duration)
      if (fg.zoom() < minZoom) fg.zoom(minZoom, duration)
    },
    [reducedMotion],
  )

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      userInteracted.current = true
      if (node.type === 'city' && node.cityId) {
        setExpandedCities((prev) => {
          if (prev.has(node.cityId as string)) return prev
          const next = new Set(prev)
          next.add(node.cityId as string)
          return next
        })
      }
      setSelected(node.id)
      focusOn(node, node.type === 'tiktok' ? 1.5 : 0.9)
    },
    [focusOn, setSelected],
  )

  const handleSelectById = useCallback(
    (id: string) => {
      const node = model.byId.get(id)
      if (!node) return
      handleNodeClick(node)
    },
    [handleNodeClick, model],
  )

  const fitToScreen = useCallback(() => {
    fgRef.current?.zoomToFit(reducedMotion ? 0 : 600, isMobile ? 48 : 96)
  }, [reducedMotion, isMobile])

  const settle = useCallback(() => {
    if (userInteracted.current) return
    if (selected) focusOn(selected, selected.type === 'tiktok' ? 1.5 : 0.9)
    else fitToScreen()
  }, [selected, focusOn, fitToScreen])

  /**
   * Frame the map while the layout settles.
   *
   * Deliberately not driven by the engine's own stop event — that fires
   * unreliably once forces are reconfigured, and a map that opens off-screen
   * is a broken first impression. Two passes are enough: one as soon as the
   * clusters have formed, one once they've stopped moving.
   */
  useEffect(() => {
    if (userInteracted.current) return
    const timers = [setTimeout(settle, 900), setTimeout(settle, 2400)]
    return () => timers.forEach(clearTimeout)
    // Re-frame when the visible set changes (expanding a city, toggling refs).
  }, [settle, data.nodes.length])

  const resetLayout = useCallback(() => {
    for (const node of model.byId.values()) {
      node.fx = undefined
      node.fy = undefined
    }
    userInteracted.current = false
    fgRef.current?.d3ReheatSimulation()
  }, [model])

  // Esc clears selection — same gesture everywhere in the app.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (query) setQuery('')
      else if (selectedId) setSelected(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [query, selectedId, setSelected])

  if (dataset.tiktoks.length === 0) {
    return (
      <div className="grid h-[calc(100dvh-52px-var(--safe-b))] place-items-center md:h-dvh">
        <EmptyState
          title="Nothing to map yet"
          description="Add TikToks to the JSON and the network builds itself."
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-52px-var(--safe-b))] overflow-hidden md:h-dvh">
      <div className="relative min-w-0 flex-1">
        <GraphCanvas
          data={data}
          model={model}
          paintState={paintState}
          fgRef={fgRef}
          onNodeClick={handleNodeClick}
          onNodeHover={(node) => setHoveredId(node?.id ?? null)}
          onBackgroundClick={() => setSelected(null)}
          onEngineStop={settle}
          onInteract={() => {
            userInteracted.current = true
          }}
        />

        {/* Overlays. `pointer-events-none` on the wrapper so the canvas stays
            fully draggable between the controls. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <GraphSearch
              value={query}
              onChange={setQuery}
              matchCount={searchMatches ? searchMatches.size : null}
            />
            <GraphControls
              onFit={fitToScreen}
              onZoomIn={() => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) * 1.5, 260)}
              onZoomOut={() => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) / 1.5, 260)}
              onReset={resetLayout}
              showReferences={showReferences}
              onToggleReferences={() => setShowReferences((v) => !v)}
              expandAll={expandAll}
              onToggleExpandAll={() => setExpandAll((v) => !v)}
              canCollapse={canCollapse}
            />
          </div>

          <div className="flex items-end justify-between gap-3">
            <GraphLegend />
            <span className="rounded-[7px] bg-canvas/60 px-2 py-1 text-[11px] tabular-nums text-ink-3 backdrop-blur-sm">
              {data.nodes.length} nodes
            </span>
          </div>
        </div>
      </div>

      {selected ? (
        <NodeInspector
          node={selected}
          model={model}
          onSelect={handleSelectById}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}
