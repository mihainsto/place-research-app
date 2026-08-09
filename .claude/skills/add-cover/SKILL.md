---
name: add-cover
description: Attach or replace the cover photo on a China 2026 TikTok — process a photo from the photos/ folder into public/covers and wire it up, or find and fit a cover for an entry that has none. Use for "add the photo for hongyancun", "I dumped new photos in the photos folder", "this entry needs a cover", or after the user drops image files into the repo.
---

# Add a cover

Turns a source photo into a web-sized cover in `public/covers/` and points a
TikTok at it.

## Where things go

| | |
|---|---|
| `photos/` | Originals, untouched. Whatever the user dropped in — camera RAWs, screenshots, phone shots. |
| `public/covers/` | Web copies, named `<tiktok-id>.jpg`. These are what ship. |

Never edit or delete anything in `photos/`. It's the archive.

## Procedure

### 1. Match photos to entries

```bash
ls photos/
```

Filenames are usually a hint, not a rule — `WadingCafe.png` → `wadingding-cafe`,
`building7streetlevel.png` → `nanguo-lijing-parking-lot`. Match on meaning, not
string similarity, and **look at the image** if the name is ambiguous. Putting
the wrong photo on an entry is worse than leaving it blank, and it's the kind
of mistake nobody notices for weeks.

If you can't confidently match a file, ask. List the unmatched files and the
entries still missing covers.

### 2. Convert

```bash
sips -s format jpeg -s formatOptions 82 -Z 1200 photos/<source> --out public/covers/<tiktok-id>.jpg
```

- `-Z 1200` caps the long edge at 1200px — enough for the detail hero at 2×.
- Quality 82 lands most photos at 140–300KB.

Camera originals (4000×6000 and up) and screenshots both take the same
settings. Check the result:

```bash
ls -lh public/covers/
```

Anything over ~400KB, re-run at `-Z 1000`. The service worker precaches every
cover, so total weight is what the user downloads before flying.

### 3. Wire it up

Set `"coverImage": "/covers/<tiktok-id>.jpg"` on the entry. The leading slash
matters — the app treats non-`http` values as repo-relative paths.

### 4. Verify

```bash
npm run validate
node -e "const d=require('./public/data/china-2026.json'),f=require('fs');for(const t of d.tiktoks){if(!t.coverImage){console.log('no cover:',t.id);continue}console.log(f.existsSync('public'+t.coverImage)?'ok  ':'MISS',t.id)}"
```

Every referenced file must exist. A path pointing at nothing renders as a
monogram tile, which looks intentional — so a broken link will not announce
itself. Check it.

### 5. Ship it

Covers are part of the board, so they go live like everything else:

```bash
git add -A && git commit -m "<which cover, for which entry>"
git push
npm run deploy
```

Commit the original in `photos/` alongside the web copy — it's the archive, and
it's what you'd re-crop from.

`npm run deploy` re-runs validate and build first. **If validate is red, stop.**

Live at https://mihainsto.github.io/place-research-app/ (public; Pages takes a
minute or two).

If the live site shows a monogram tile where your photo should be, the cover
404'd — that failure is silent by design, because a missing cover is a designed
state. See `docs/DEPLOY.md`.

### 6. Report

Which photo went to which entry, the sizes, anything left unmatched, and the
commit hash.

## Sourcing a cover from the web

If an entry has no photo and the user wants one found: collect 2–3 candidates
with their source pages, **ask before downloading**, then convert as above.
Never download images and ask afterwards. An entry with no cover is fine —
the placeholder is designed.
