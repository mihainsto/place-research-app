import { forceCollide, forceX, forceY, type Simulation } from 'd3-force'
import type { GraphModel, GraphNode } from '@/lib/graph/model'

/**
 * City clustering.
 *
 * Rather than one global simulation (which produces a hairball), each city
 * gets an anchor on a ring and its TikToks are pulled toward it. The result
 * is distinct constellations that still float organically — the difference
 * between a knowledge map and a dependency graph.
 */

interface ForceApi {
  d3Force(name: string): unknown
  d3Force(name: string, force: unknown): unknown
}

export function configureForces(fg: ForceApi, model: GraphModel) {
  const anchorFor = (node: GraphNode) => {
    if (node.type === 'project') return { x: 0, y: 0 }
    if (!node.cityId) return { x: 0, y: 0 }
    return model.anchors.get(node.cityId) ?? { x: 0, y: 0 }
  }

  const charge = fg.d3Force('charge') as { strength: (fn: (n: GraphNode) => number) => void; distanceMax: (v: number) => void } | undefined
  if (charge) {
    charge.strength((node) => {
      switch (node.type) {
        case 'project':
          return -420
        case 'city':
          return -320
        case 'tiktok':
          return -110
        default:
          return -26
      }
    })
    charge.distanceMax(520)
  }

  const link = fg.d3Force('link') as
    | { distance: (fn: (l: { kind?: string }) => number) => void; strength: (fn: (l: { kind?: string }) => number) => void }
    | undefined
  if (link) {
    link.distance((l) => {
      switch (l.kind) {
        case 'project-city':
          return 260
        case 'city-tiktok':
          // Far enough that TikToks orbit the city rather than sit on it,
          // and that their labels clear the city's own label.
          return 140
        default:
          return 44
      }
    })
    link.strength((l) => (l.kind === 'tiktok-ref' ? 0.9 : l.kind === 'city-tiktok' ? 0.22 : 0.05))
  }

  // The default centring force fights the anchors — remove it.
  fg.d3Force('center', null)

  fg.d3Force(
    'clusterX',
    forceX<GraphNode>((node) => anchorFor(node).x).strength((node) =>
      node.type === 'city' ? 0.5 : node.type === 'tiktok' ? 0.12 : 0.02,
    ),
  )
  fg.d3Force(
    'clusterY',
    forceY<GraphNode>((node) => anchorFor(node).y).strength((node) =>
      node.type === 'city' ? 0.5 : node.type === 'tiktok' ? 0.12 : 0.02,
    ),
  )

  // Padding accounts for the label drawn *below* each node, not just the node
  // itself — otherwise nodes clear each other but their captions collide.
  fg.d3Force(
    'collide',
    forceCollide<GraphNode>((node) => {
      switch (node.type) {
        case 'project':
          return node.radius + 26
        case 'city':
          return node.radius + 24
        case 'tiktok':
          return node.radius + 20
        default:
          return node.radius + 6
      }
    })
      .strength(0.9)
      .iterations(2),
  )
}

export type GraphSimulation = Simulation<GraphNode, undefined>
