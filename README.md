# China 2026

A visual command center for planning and shooting TikToks across China.

JSON in, creative board out. There is no admin UI, no forms, and no "New TikTok"
button — an LLM writes the JSON, the app renders it.

```
public/data/china-2026.json  →  React  →  Wall · Graph · Script
```

## Running it

```bash
npm install
npm run dev
```

| | |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run validate` | Check the data file — **run before every commit** |
| `npm run schema` | Regenerate the JSON Schema from Zod |
| `npm run stress 240` | Generate a synthetic dataset to check it scales |
| `npm run typecheck` | Types only |

## Adding a TikTok

You don't fill in a form. You tell an LLM, it writes JSON, you commit.

### In Claude Code

Three skills live in `.claude/skills/` and trigger on plain requests:

| Skill | Say something like |
|---|---|
| **add-tiktok** | *"add the shenzhen food drone delivery"* — researches the venue name, sources and a cover, then writes the entry |
| **update-tiktok** | *"I filmed the diarrhea clinic"*, *"bump the gas station to must film"* |
| **add-cover** | *"I dumped new photos in the photos folder"* |

`add-tiktok` follows one rule above all others: **anything you supply is taken
verbatim and never researched over.** Give it a full entry and it does no
searching; give it four words and it fills in the rest. It asks before
downloading any image, and leaves a field blank rather than guessing.

### In Codex

The same three skills live in `.codex/skills/`:

| Skill | Use it for |
|---|---|
| **add-tiktok** | Add a new place or idea, with targeted research for missing fields |
| **update-tiktok** | Change an existing entry without changing its permalink id |
| **add-cover** | Convert a photo from `photos/` and attach it to an entry |

Invoke them by name, for example `$add-tiktok`, or use the same plain-language
requests shown above.

### By hand, or with any other LLM

1. Give it [`docs/LLM_INSTRUCTIONS.md`](docs/LLM_INSTRUCTIONS.md).
2. Ask it to add or update an entry in `public/data/china-2026.json`.
3. `npm run validate`
4. Commit. That's the deploy.

## The views

**Wall** (`/`) — the home view. A uniform grid of covers: title, priority,
category. Status is the 2px hairline along the bottom of each cover.

Filters live in the URL, which is the point: `/?city=chongqing&status=ready-to-film`
is a bookmark you tap when you land in Chongqing. `⌘K` searches everything,
including script text.

**TikTok** (`/t/:id`) — cover, title, location, references, script. Nothing behind
a tab or a "read more". The script gets large type, generous leading and a text
size control, and the screen is kept awake while it's open.

**Timeline** (`/timeline`) — the trip as a shooting schedule. Consecutive days in
one city group into a leg, and each leg carries that city's TikToks as its shot
list, so you never list TikToks in the timeline data. It also surfaces the two
things a calendar can't: cities you have material for but no days in, and days
in a city with nothing on the board yet.

**Graph** (`/graph`) — the network: project → cities → TikToks → references.
TikTok nodes are their own cover images. Click a city and its constellation
lights while everything else dims; click a TikTok and its references fade in
around it.

Past 150 TikToks (and always on mobile) the graph starts collapsed to cities —
expand what you're interested in, or hit **All TikToks**. References are hidden
by default because they otherwise triple the node count.

## Notes for whoever works on this next

**Dark mode only.** One palette, no `dark:` variants, no toggle. Surface and ink
tokens are in `src/styles/theme.css`; status and category colours are in
`src/lib/constants.ts` and deliberately live in exactly one of those two places.

**Three entities and no more:** TikTok, City, Reference. Status, priority,
category, location and script are *attributes* of a TikTok, not things.

**Everything written goes in `script`.** No hook/caption/shotlist fields, ever.

**Filter state belongs in the URL**, not a store. There is no state library and
the app doesn't need one — the dataset is immutable after load, so React context
plus `useSearchParams` covers it.

**The data layer is forgiving by design.** See [`docs/DATA.md`](docs/DATA.md). Bad
entries degrade and get reported in the Data health dialog; they don't take the
app down.

### It's built for being in China

- **No webfonts.** System stack only — SF Pro on your devices. Google Fonts is
  blocked in mainland China and would stall first paint in the field.
- **Offline.** The app shell, the dataset and **every cover** are precached by a
  service worker (~2.7MB). Open the app once on wifi before you fly and the whole
  board — scripts included — works with no signal at all.
- **Apple Maps first.** It works in mainland China; Google Maps does not without a
  VPN. `location.amapUrl` (高德地图) is supported and worth filling in.
- **Commit your covers.** `coverImage` accepts `/covers/foo.jpg` as well as a URL.
  Anything hotlinked from a Western CDN may be slow or blocked on the ground.

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · React Router 7 · Zod 4 ·
react-force-graph-2d · Radix (popover, dialog) · cmdk · react-markdown

## Deploying

**Live:** https://mihainsto.github.io/place-research-app/ — public.

```bash
npm run deploy
```

Runs `validate` → `build` → publishes `dist/` to the `gh-pages` branch.
Validation first, so a broken dataset can't reach the live site. The three
skills above do this for you after every change.

Full ship sequence and the GitHub Pages gotchas (subpath base, the `404.html`
fallback, asset paths that fail *silently*) are in [`docs/DEPLOY.md`](docs/DEPLOY.md).

It also builds for any other static host — `vercel.json` and `public/_redirects`
are included for Vercel and Netlify, which have real rewrite rules and don't
need the 404 trick.

## Covers

Real covers live in `public/covers/` and are referenced as `/covers/<id>.jpg`.
Originals stay untouched in `photos/`.

To add one: drop the original in `photos/`, then

```bash
sips -s format jpeg -s formatOptions 82 -Z 1200 photos/YOUR.png --out public/covers/<tiktok-id>.jpg
```

1200px on the long edge is enough for the detail hero at 2× and keeps each
cover around 150–280KB, which matters when the service worker is caching them
all for offline use.

A TikTok with no `coverImage` is not broken — it renders a monogram tile built
from its title.
