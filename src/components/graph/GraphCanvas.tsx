import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { configureForces } from '@/lib/graph/forces'
import { linkColor, linkWidth, paintNode, paintPointerArea, type PaintState } from '@/lib/graph/paint'
import type { GraphLink, GraphModel, GraphNode } from '@/lib/graph/model'

export type FGMethods = ForceGraphMethods<GraphNode, GraphLink>

interface Props {
  data: { nodes: GraphNode[]; links: GraphLink[] }
  model: GraphModel
  paintState: PaintState
  fgRef: React.RefObject<FGMethods | undefined>
  onNodeClick: (node: GraphNode) => void
  onNodeHover: (node: GraphNode | null) => void
  onBackgroundClick: () => void
  onEngineStop: () => void
  /** Any deliberate pan/zoom/drag — after this we stop re-framing the map. */
  onInteract: () => void
}

export function GraphCanvas({
  data,
  model,
  paintState,
  fgRef,
  onNodeClick,
  onNodeHover,
  onBackgroundClick,
  onEngineStop,
  onInteract,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  /**
   * The canvas needs explicit pixel dimensions, so we measure the container.
   *
   * Measure synchronously first and use ResizeObserver only for *changes* —
   * its initial observation is not reliably delivered, and depending on it
   * meant a page loaded straight onto /graph could render nothing at all.
   */
  useLayoutEffect(() => {
    const node = containerRef.current
    if (!node) return

    const measure = () => {
      const rect = node.getBoundingClientRect()
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)

    // Belt and braces: a window resize must always re-measure, even if the
    // observer misses it. A canvas stuck at a stale size is a dead graph.
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  // The paint callbacks must keep a stable identity (they're handed to the
  // canvas engine) while always seeing current state — hence the ref.
  const stateRef = useRef(paintState)
  stateRef.current = paintState

  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, scale: number) =>
      paintNode(node, ctx, scale, stateRef.current),
    [],
  )

  const drawPointerArea = useCallback(
    (node: GraphNode, color: string, ctx: CanvasRenderingContext2D) =>
      paintPointerArea(node, color, ctx),
    [],
  )

  const getLinkColor = useCallback((link: GraphLink) => linkColor(link, stateRef.current), [])
  const getLinkWidth = useCallback((link: GraphLink) => linkWidth(link, stateRef.current), [])

  // The graph instance only exists once the container has been measured, so
  // this must depend on `size.width` — on first mount `fgRef.current` is
  // still undefined and the clustering forces would silently never apply.
  useEffect(() => {
    if (size.width === 0) return
    const fg = fgRef.current
    if (!fg) return
    configureForces(fg, model)
  }, [fgRef, model, size.width])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onPointerDown={onInteract}
      onWheel={onInteract}
    >
      {size.width > 0 ? (
        <ForceGraph2D<GraphNode, GraphLink>
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="#08090a"
          /* Custom painting is the whole point — replace the default entirely. */
          nodeCanvasObject={drawNode}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={drawPointerArea}
          nodeLabel={() => ''}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkCurvature={0}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
          onBackgroundClick={onBackgroundClick}
          onNodeDragEnd={(node) => {
            // Dragging pins a node. "Reset layout" in the controls unpins.
            node.fx = node.x
            node.fy = node.y
            onInteract()
          }}
          onEngineStop={onEngineStop}
          /* We tween node opacity ourselves, so the engine must keep painting
             even once the layout has settled. */
          autoPauseRedraw={false}
          cooldownTicks={220}
          d3VelocityDecay={0.32}
          minZoom={0.06}
          maxZoom={7}
          enableNodeDrag
        />
      ) : null}
    </div>
  )
}
