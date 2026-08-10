/**
 * npm run validate
 *
 * The gate between your LLM and a commit. Runs both layers:
 *
 *   STRICT  — the authoring schema. "Is this JSON up to standard?"
 *   RUNTIME — the real normalizer. "What will the app actually do with it?"
 *
 * Exit code 1 on anything that would cost you a TikTok. Warnings are printed
 * but do not fail, because the app handles them.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { AuthoringDatasetSchema } from '@/data/schema'
import { DataFormatError, normalizeDataset } from '@/data/normalize'

const FILE = resolve(process.cwd(), process.argv[2] ?? 'public/data/china-2026.json')

const dim = (s: string) => `[2m${s}[0m`
const red = (s: string) => `[31m${s}[0m`
const yellow = (s: string) => `[33m${s}[0m`
const green = (s: string) => `[32m${s}[0m`
const bold = (s: string) => `[1m${s}[0m`

let raw: string
try {
  raw = readFileSync(FILE, 'utf8')
} catch {
  console.error(red(`✗ Cannot read ${FILE}`))
  process.exit(1)
}

let json: unknown
try {
  json = JSON.parse(raw)
} catch (error) {
  console.error(red(`✗ ${FILE} is not valid JSON`))
  console.error(`  ${(error as Error).message}`)
  console.error(dim('  A trailing comma or an unescaped quote is the usual cause.'))
  process.exit(1)
}

console.log(bold(`\nValidating ${FILE}\n`))

// --- 1. Will the app load it at all? ---------------------------------------

let normalized
try {
  normalized = normalizeDataset(json)
} catch (error) {
  if (error instanceof DataFormatError) {
    console.error(red(`✗ ${error.message}`))
    process.exit(1)
  }
  throw error
}

const errors = normalized.issues.filter((i) => i.level === 'error')
const warnings = normalized.issues.filter((i) => i.level === 'warning')

console.log(
  `  ${bold(String(normalized.tiktoks.length))} TikToks · ` +
    `${bold(String(normalized.cities.length))} cities · ` +
    `${bold(String(normalized.tiktoks.reduce((n, t) => n + t.references.length, 0)))} references` +
    (normalized.timeline.length
      ? ` · ${bold(String(normalized.timeline.length))} days planned`
      : ''),
)

// --- 2. Is it up to authoring standard? ------------------------------------

const strict = AuthoringDatasetSchema.safeParse(json)
const strictIssues = strict.success ? [] : strict.error.issues

if (errors.length) {
  console.log(red(`\n  ${errors.length} entr${errors.length === 1 ? 'y' : 'ies'} will NOT render:\n`))
  for (const issue of errors) {
    console.log(`  ${red('✗')} ${bold(issue.subject)} ${dim(issue.path)}`)
    console.log(`    ${issue.message}`)
  }
}

if (warnings.length) {
  console.log(yellow(`\n  ${warnings.length} warning${warnings.length === 1 ? '' : 's'} (app handles these, but worth fixing):\n`))
  for (const issue of warnings) {
    console.log(`  ${yellow('!')} ${bold(issue.subject)} ${dim(issue.path)}`)
    console.log(`    ${issue.message}`)
  }
}

if (strictIssues.length) {
  console.log(dim(`\n  ${strictIssues.length} strict-schema note${strictIssues.length === 1 ? '' : 's'} — optional polish:\n`))
  for (const issue of strictIssues.slice(0, 25)) {
    console.log(dim(`  · ${issue.path.join('.') || '(root)'} — ${issue.message}`))
  }
  if (strictIssues.length > 25) console.log(dim(`  … and ${strictIssues.length - 25} more`))
}

// --- 3. Cross-checks the schema can't express ------------------------------

const crossErrors: string[] = []

const ids = new Map<string, number>()
for (const t of normalized.tiktoks) ids.set(t.id, (ids.get(t.id) ?? 0) + 1)
for (const [id, n] of ids) if (n > 1) crossErrors.push(`Duplicate id after normalisation: "${id}" (${n}×)`)

const missingScripts = normalized.tiktoks.filter(
  (t) => !t.script && (t.status === 'Ready to Film' || t.status === 'Filmed'),
)
for (const t of missingScripts) {
  console.log(
    yellow(`\n  ! "${t.title}" is ${t.status} but has no script — that is the one thing you need on location.`),
  )
}

// A city you have material for but no days in is a planning gap, not a data
// error — worth saying out loud, not worth failing on.
if (normalized.timeline.length) {
  const scheduled = new Set(normalized.timeline.map((d) => d.cityId))
  const counts = new Map<string, number>()
  for (const t of normalized.tiktoks) counts.set(t.cityId, (counts.get(t.cityId) ?? 0) + 1)

  for (const city of normalized.cities) {
    const n = counts.get(city.id) ?? 0
    if (n > 0 && !scheduled.has(city.id)) {
      console.log(yellow(`\n  ! ${n} TikTok${n === 1 ? '' : 's'} in ${city.name}, but no days scheduled there.`))
    }
    if (n === 0 && scheduled.has(city.id)) {
      console.log(dim(`\n  · Days scheduled in ${city.name} but nothing on the board there yet.`))
    }
  }
}

if (crossErrors.length) {
  console.log(red('\n  Cross-check failures:\n'))
  for (const e of crossErrors) console.log(`  ${red('✗')} ${e}`)
}

// --- Verdict ---------------------------------------------------------------

const fatal = errors.length + crossErrors.length

if (fatal === 0) {
  console.log(green(`\n✓ Good to commit.${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}\n`))
  process.exit(0)
}

console.log(red(`\n✗ ${fatal} problem${fatal === 1 ? '' : 's'} would cost you content.\n`))
process.exit(1)
