---
name: add-cover
description: Attach or replace the cover photo on a China 2026 TikTok—process a photo from the photos/ folder into public/covers and wire it up, or find and fit a cover for an entry that has none. Use when the user asks to add a photo, drops image files into the repository, or says an entry needs a cover.
---

# Add a cover

Turn a source photo into a web-sized cover in `public/covers/` and point the
matching TikTok at it.

## Where things go

| | |
|---|---|
| `photos/` | Originals, untouched. Camera files, screenshots, and phone photos stay here. |
| `public/covers/` | Web copies named `<tiktok-id>.jpg`; these ship with the app. |

Never edit or delete anything in `photos/`. It is the archive.

## Procedure

### 1. Match photos to entries

List `photos/` and compare the files with the TikTok ids and titles in
`public/data/china-2026.json`. Filenames are hints, not rules:
`WadingCafe.png` maps to `wadingding-cafe`, while
`building7streetlevel.png` maps to `nanguo-lijing-parking-lot`.

Match on meaning, not just string similarity. If a filename is ambiguous, use
Codex’s `view_image` tool to inspect it before assigning it. A wrong cover is
worse than a missing cover. If no confident match exists, ask and list the
unmatched files and entries still missing covers.

### 2. Convert

Run:

```bash
sips -s format jpeg -s formatOptions 82 -Z 1200 photos/<source> --out public/covers/<tiktok-id>.jpg
```

- `-Z 1200` caps the long edge at 1200px, enough for the detail hero at 2×.
- Quality 82 usually produces a 140–300KB file.
- If the output is over about 400KB, rerun with `-Z 1000`.

Check the resulting size with `ls -lh public/covers/`. The service worker
precaches every cover, so total weight affects offline use.

### 3. Wire it up

Set the matching object’s `coverImage` to:

```json
"coverImage": "/covers/<tiktok-id>.jpg"
```

The leading slash matters: the app treats non-HTTP values as repo-relative
paths and resolves them against the deployed base path.

### 4. Verify

Run:

```bash
npm run validate
node -e "const d=require('./public/data/china-2026.json'),f=require('fs');for(const t of d.tiktoks){if(!t.coverImage){console.log('no cover:',t.id);continue}console.log(f.existsSync('public'+t.coverImage)?'ok  ':'MISS',t.id)}"
```

Every referenced local file must exist. A broken cover silently renders as a
designed monogram tile, so verify it explicitly. If validation is red, stop
and report the error; do not commit or deploy.

### 5. Ship it

Once validation is green, use the project’s normal ship sequence:

```bash
git add -A && git commit -m "<which cover, for which entry>"
git push
npm run deploy
```

Commit the original in `photos/` alongside the web copy. `npm run deploy`
validates and builds before publishing. The live site is
`https://mihainsto.github.io/place-research-app/`.

### 6. Report

Report which photo went to which entry, the output sizes, anything left
unmatched, and the commit hash.

## Sourcing a cover from the web

If the user wants a cover found online, use the web tool’s `image_query` or
`search_query` and collect 2–3 candidates. Open each source page and record the
source page, what the image shows, and a rough size. Ask the user which one to
use before downloading anything. Never download first and ask afterwards.

After approval, download to a temporary path, convert it as above, and set the
repo-relative `coverImage`. An entry with no cover is acceptable; the designed
placeholder is safer than an unverified image.
