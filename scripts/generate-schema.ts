/**
 * Regenerates `schema/china-2026.schema.json` from the Zod authoring schema.
 * Run after changing the schema:  npm run schema
 *
 * That file is what you hand to the LLM (together with docs/LLM_INSTRUCTIONS.md).
 * Zod stays the single source of truth so the two can never disagree.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { z } from 'zod'
import { AuthoringDatasetSchema } from '@/data/schema'

const OUT = resolve(process.cwd(), 'schema/china-2026.schema.json')

const jsonSchema = z.toJSONSchema(AuthoringDatasetSchema, {
  target: 'draft-2020-12',
  io: 'input',
})

const doc = {
  $id: 'https://china-2026.local/schema/china-2026.schema.json',
  title: 'China 2026 — TikTok command center',
  ...jsonSchema,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')

console.log(`Wrote ${OUT}`)
