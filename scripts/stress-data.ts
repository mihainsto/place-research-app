/**
 * npm run stress [count]
 *
 * Generates a synthetic dataset so you can check the Wall and the Graph still
 * feel fast at a scale you don't have yet. Writes to
 * `public/data/china-2026.stress.json` and never touches your real data.
 *
 * To try it:
 *   npm run stress 240
 *   cp public/data/china-2026.json public/data/_real.json
 *   cp public/data/china-2026.stress.json public/data/china-2026.json
 *   # …look around…
 *   mv public/data/_real.json public/data/china-2026.json
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { KNOWN_CATEGORIES, PRIORITIES, STATUSES } from '@/lib/constants'

const count = Number(process.argv[2] ?? 240)
const OUT = resolve(process.cwd(), 'public/data/china-2026.stress.json')

const CITIES = [
  ['chongqing', 'Chongqing', 'Southwest'],
  ['chengdu', 'Chengdu', 'Southwest'],
  ['shenzhen', 'Shenzhen', 'South'],
  ['shanghai', 'Shanghai', 'East'],
  ['beijing', 'Beijing', 'North'],
  ['changsha', 'Changsha', 'Central'],
  ['xian', "Xi'an", 'Northwest'],
  ['guangzhou', 'Guangzhou', 'South'],
  ['harbin', 'Harbin', 'Northeast'],
  ['kunming', 'Kunming', 'Southwest'],
  ['guilin', 'Guilin', 'South'],
  ['hangzhou', 'Hangzhou', 'East'],
]

// Deterministic PRNG so two runs produce the same file.
let seed = 42
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]

const NOUNS = ['Market', 'Tunnel', 'Rooftop', 'Night Bus', 'Bathhouse', 'Escalator', 'Alley', 'Ferry', 'Temple', 'Factory', 'Karaoke Room', 'Noodle Shop']
const HOOKS = ['Nobody Told Me About', 'I Queued Two Hours For', 'The Truth About', 'You Cannot Film Inside', 'Everyone Ignores']

const tiktoks = Array.from({ length: count }, (_, i) => {
  const [cityId] = pick(CITIES)
  const title = `${pick(HOOKS)} This ${pick(NOUNS)} #${i + 1}`
  const refCount = Math.floor(rand() * 4)

  return {
    id: `stress-${i + 1}`,
    title,
    cityId,
    status: pick(STATUSES),
    priority: pick(PRIORITIES),
    category: pick(KNOWN_CATEGORIES),
    coverImage: `https://picsum.photos/seed/stress${i}/600/750`,
    location: {
      name: `Test location ${i + 1}`,
    },
    references: Array.from({ length: refCount }, (_, r) => ({
      title: `Reference ${r + 1} for #${i + 1}`,
      url: `https://example.com/stress/${i}/${r}`,
    })),
    script: `## Hook\n\nSynthetic entry ${i + 1}, generated to test scale.\n\n## Beats\n\n- One\n- Two\n- Three\n\nThis text exists only to give the script section something to lay out.`,
  }
})

const dataset = {
  project: { name: `China 2026 (stress ${count})`, updatedAt: '2026-08-09' },
  cities: CITIES.map(([id, name, region]) => ({ id, name, region })),
  tiktoks,
}

writeFileSync(OUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')

const refTotal = tiktoks.reduce((n, t) => n + t.references.length, 0)
console.log(`Wrote ${OUT}`)
console.log(`  ${count} TikToks · ${CITIES.length} cities · ${refTotal} references`)
console.log(`  graph nodes: ${count + CITIES.length + 1} without references, ${count + CITIES.length + 1 + refTotal} with`)
