import { normalizeDataset } from '@/data/normalize'
import type { Dataset } from '@/data/schema'

/**
 * The source of truth is a single JSON file fetched at runtime — not a
 * bundled import. That is what makes "LLM writes JSON → app renders it" true
 * without a rebuild, and it lets us quarantine bad entries at runtime instead
 * of failing a build.
 *
 * If this file ever grows past comfort, shard it into `data/cities/*.json`
 * and fetch a manifest here. Nothing outside this module would change.
 */
export const DATA_PATH = `${import.meta.env.BASE_URL}data/china-2026.json`

export async function loadDataset(signal?: AbortSignal): Promise<Dataset> {
  let response: Response
  try {
    response = await fetch(DATA_PATH, { signal, cache: 'no-cache' })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new Error(`Could not reach ${DATA_PATH}. Check your connection and try again.`)
  }

  if (!response.ok) {
    throw new Error(
      `${DATA_PATH} returned ${response.status}. Make sure the data file exists in /public/data.`,
    )
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new Error(
      `${DATA_PATH} is not valid JSON. A trailing comma or an unescaped quote is the usual cause — run \`npm run validate\` for the exact position.`,
    )
  }

  return normalizeDataset(json)
}
