# Deploying

The board is a static site on GitHub Pages.

**Live:** https://mihainsto.github.io/place-research-app/

```bash
npm run deploy
```

That's it. It runs `validate` → `build` → publishes `dist/` to the `gh-pages`
branch. Validation runs first on purpose: a dataset that would cost you a
TikTok can't reach the live site.

## The full ship sequence

```bash
npm run validate                       # must be green
git add -A && git commit -m "…"
git push
npm run deploy
```

`main` holds the source; `gh-pages` holds the built output and is written only
by the deploy script. Never edit `gh-pages` by hand.

## Three things GitHub Pages makes you handle

**1. It serves from a subpath.** Not a domain root — `/place-research-app/`.
`vite.config.ts` sets `base` for production builds only, and everything
downstream reads `import.meta.env.BASE_URL`: the router basename, the data
fetch, the service worker scope. If you rename the repo, change `REPO` in
`vite.config.ts` and nothing else.

**2. It has no rewrite rules.** A hard load of `/t/some-id` would 404. Pages
serves `404.html` for unmatched paths, so `scripts/postbuild.mjs` copies
`index.html` to `404.html` — the app boots, React Router reads the URL still in
the address bar, and the right page renders. The same script writes
`.nojekyll`, without which Pages runs the output through Jekyll and silently
drops anything starting with an underscore.

**3. Root-relative asset paths break.** The data file stores covers as
`/covers/foo.jpg`, which points at the domain root. `src/lib/asset.ts` resolves
them against the base at render time.

Watch for this one — it fails *silently*. A cover that 404s renders the
designed monogram tile, which looks entirely deliberate. If the live site shows
lettered tiles where photos should be, this is why.

## Verifying a deploy

Pages takes a minute or two. Then check, in this order:

1. The Wall shows **photos**, not monogram tiles → asset paths resolved.
2. Hard-refresh on a detail URL like `/place-research-app/t/diarrhea-clinic`
   → the 404 fallback works.
3. The Graph renders nodes with cover images → the canvas image cache resolved
   the base too.

### The stale service worker

The worker from the previous deploy will happily keep serving the previous
build, which hides all three checks above. Worse, if the deploy *added* a route,
that route renders "Nothing here" in the old build — it looks broken rather than
out of date. This is how the Timeline page first appeared to fail.

It's handled now: `skipWaiting` + `clientsClaim` make the new worker take over
immediately, and `src/main.tsx` reloads once when it does (guarded so a
first-ever visit never reloads). If you ever suspect it anyway, check which
bundle is live:

```js
document.querySelector('script[type=module]').src
```

Compare the hash against `dist/index.html`. If they differ, the old worker is
still in charge — DevTools → Application → Service Workers → Unregister, then
hard reload.

## It's a public site

The repo is public and so is the board — scripts, locations, photos, the lot,
at a guessable URL. That's fine for a travel board, but it is a decision worth
making knowingly rather than discovering.

To take it down: delete the `gh-pages` branch, or switch Pages off in the repo
settings.

## First-time setup

Only needed once, and it's already done:

- `gh-pages` is a devDependency.
- Repo Settings → Pages → Source: **Deploy from a branch**, branch `gh-pages`, `/`.

If the site 404s after a successful deploy, that setting is the thing to check.
