---
name: add-tiktok
description: Add a new TikTok entry to the China 2026 board, researching whatever the user didn't supply — the real venue name, maps links, source links and a cover photo. Use whenever the user wants a place, idea or link added to the board: "add the shenzhen food drone delivery", "add this to my China database", "put the Chongqing ghost city on the board", or when they paste a reel/article/photo and want an entry made from it.
---

# Add a TikTok

Creates one new entry in `public/data/china-2026.json`, filling gaps by research.

## The one rule that governs everything

**Whatever the user supplies wins. Research only fills the gaps.**

Read their message first and write down every field they gave you, in their
words. Those are frozen — never "improve", re-title, re-categorise or
re-locate them. Then research *only* what is still missing.

A user who says

> add the shenzhen food drone delivery

gave you a city and a subject and nothing else — research the rest.

A user who says

> add Wadingding Café in Chongqing, Maybe, Food, it's on the 5th floor of the
> S95 Super Dimension Center

gave you five fields. Research nothing except what's still blank, and do not
touch those five.

If they supply something that looks wrong, use it anyway and say so afterwards.
It's their board.

## Second rule: never invent

Every field is optional in the app and every empty state is designed. A blank
`location` renders "No location yet". A missing `coverImage` renders a monogram
tile. **An omitted field is always better than a plausible guess.**

Never fabricate: an address, a venue name, a metro station, an opening time, a
URL, or a source you did not actually open. If research is inconclusive, leave
the field out and list it under "Couldn't confirm" in your report.

## Procedure

### 1. Read the schema

`docs/LLM_INSTRUCTIONS.md` is the field contract. Follow it exactly — enum
spellings, kebab-case ids, the no-new-fields rule.

### 2. Inventory what you were given

List: title, city, priority, category, status, location, references, script,
cover. Mark each *supplied* or *missing*.

### 3. Research the missing pieces

Use WebSearch/WebFetch. Aim for, in priority order:

1. **The real venue name** — what it's actually called, ideally with the
   district. This is the single most valuable thing you can find, because the
   app derives Apple/Google Maps search links from `location.name` + city. A
   precise name is worth more than a URL.
2. **Chinese name** if you find one — put it in `location.name` alongside the
   English (`Nanshan Drone Port 南山无人机港`). It's what you'll show a taxi driver.
3. **Source links** for `references` — the reel, video or article the thing is
   documented in. Only URLs you actually fetched and confirmed are about this
   place.
4. **An Amap link** (`https://uri.amap.com/search?keyword=...`) if you're
   confident of the name. Google Maps doesn't work in mainland China; Amap does.
5. **Facts worth knowing on the ground** — access, hours, whether it's even
   open to the public, whether filming is allowed.

Stop researching once you have the venue name and one good source. This is a
planning board, not a dossier.

### 4. The cover photo — ask before downloading

Three cases, in order:

**a. The user attached or named a photo, or one is already in `photos/`.**
Look for a plausible match (`ls photos/`). Use it — no search needed.

**b. No photo, but research surfaced candidates.**
Collect 2–3 image URLs *with the page they came from* and what each shows.
Then **stop and ask** which to use, showing source and rough size. Do not
download first and ask later.

**c. Nothing suitable.**
Omit `coverImage` entirely and say so. The monogram tile looks deliberate; a
wrong or ugly image does not.

Once approved:

```bash
curl -L -o /tmp/cover-src "<approved url>"
sips -s format jpeg -s formatOptions 82 -Z 1200 /tmp/cover-src --out public/covers/<tiktok-id>.jpg
```

Keep the original in `photos/` if it's the user's own file. Set
`"coverImage": "/covers/<tiktok-id>.jpg"`.

### 5. Defaults for what can't be researched

| Field | Default | Why |
|---|---|---|
| `status` | `Idea` | It's a new idea until they say otherwise. |
| `priority` | **ask** | Not researchable and not guessable — it's the whole point of the Wall. One short question is fine. |
| `category` | infer from the subject | Use an existing one from the data if it fits; see the preferred list in `docs/LLM_INSTRUCTIONS.md`. |
| `id` | kebab-case of the title | Must be unique — check the file. Permanent once written. |

### 6. Script: research notes, not a fake creative script

If you researched anything, put it in `script` as notes, clearly framed:

```markdown
## What I found

- Facts, each one you can stand behind.
- Access/permission reality if you found it.

## Open questions

- What you couldn't confirm and where to check.
```

**Do not write a hook, beats, or a voiceover unless the user asks for one.**
The script is where they write; you're leaving them raw material, not a draft
they have to delete. If they gave you their own description, keep their words
verbatim above your notes — including any half-finished sentence.

### 7. Add the city if it's new

If `cityId` isn't already in `cities[]`, add `{ id, name, region }`.

### 8. Write, validate, report

Append the object to `tiktoks`. Don't reformat or reorder anything else — the
file is in git and the diff should be just your entry.

```bash
npm run validate
```

Green or fix it. Then report in three short lists:

- **Supplied by you** — the fields taken verbatim.
- **Researched** — each with the source you got it from.
- **Couldn't confirm** — left blank, and where to look.

Keep it to a few lines. Don't restate the JSON.

## Worked example

> add the shenzhen food drone delivery

Supplied: city (Shenzhen), subject (drone food delivery). Everything else missing.

Research → Meituan operates drone delivery in Shenzhen with public pickup
kiosks; find a specific named kiosk and its district; find a reel or news
piece showing one landing; check whether you can stand next to it.

Ask: priority? Offer cover candidates with sources.

Result: `cityId: shenzhen` (city added to `cities[]`), a precise
`location.name` with the Chinese name, one or two `references`, `status: Idea`,
the priority they chose, a `category` like `Urban`, and a `script` holding what
you found plus what you couldn't confirm.

## Related

- `/update-tiktok` — change an existing entry
- `/add-cover` — attach a photo to an entry that already exists
