/**
 * GitHub Pages has no rewrite rules, so a hard load of /t/:id would 404.
 *
 * The fix is that Pages serves `404.html` for any unmatched path — and if
 * 404.html *is* the app, it boots, React Router reads the URL that's still in
 * the address bar, and the right page renders. Same trick, no redirect dance.
 *
 * Also writes `.nojekyll` so Pages doesn't run the output through Jekyll,
 * which silently drops files and folders beginning with an underscore.
 */
import { copyFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(process.cwd(), 'dist')
const index = resolve(dist, 'index.html')

if (!existsSync(index)) {
  console.error('postbuild: dist/index.html not found — did the build run?')
  process.exit(1)
}

copyFileSync(index, resolve(dist, '404.html'))
writeFileSync(resolve(dist, '.nojekyll'), '')

console.log('postbuild: wrote dist/404.html and dist/.nojekyll')
