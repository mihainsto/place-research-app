---
name: add-tiktok
description: Add a new TikTok entry to the China 2026 board, researching only what the user did not supply—venue name, city data, map links, source links, and an optional cover. Use when the user wants a place, idea, pasted reel, article, or photo added to public/data/china-2026.json.
---

# Add a TikTok

Create one new entry in `public/data/china-2026.json`, filling gaps with
targeted research.

## Rules

### Preserve the user’s input

Whatever the user supplies wins. Read the request first and record every field
they gave you in their words. Freeze those values: do not retitle,
recategorize, relocate, or otherwise “improve” them. Research only missing
fields.

A supplied judgement that seems unusual still belongs on the user’s board. The
exception is a misspelled place name that would make a map link wrong: research
the correction, use it, and say plainly what changed and why.

### Never invent

Every empty state is intentional. Never fabricate an address, venue name,
station, hours, URL, or source page that you did not actually open. If research
is inconclusive, omit the field and list it under “Couldn’t confirm”.

## Procedure

### 1. Read the contract

Read `docs/LLM_INSTRUCTIONS.md` and follow its field contract, enum spellings,
kebab-case ids, timeline rules, and no-new-fields rule. Use the machine schema
at `schema/china-2026.schema.json` when field details are unclear.

### 2. Inventory the request

Track title, city, priority, category, status, location, references, script,
and cover as either supplied or missing. Preserve supplied text verbatim where
the user gave wording.

### 3. Research missing pieces

Use Codex web search and page-opening tools (`search_query` and `open`) for
research. Open every page whose URL is placed in `references`; do not claim a
fact or source based only on a search-result snippet.

Aim for these, in order, and stop once the venue name and one good source are
confirmed:

1. The real venue name, ideally with its district. This is most valuable because
   the app derives Apple and Google Maps search links from the name and city.
2. The Chinese name, alongside the English name, when confirmed.
3. Source links for the reel, video, or article actually documenting the place.
4. A specific Amap search or place link when the name is reliable.
5. Useful on-the-ground facts such as access, hours, public access, or filming
   restrictions.

Do not turn this planning board into a dossier.

### 4. Handle the cover

Use this order:

1. If the user attached or named a photo, or a plausible file is already in
   `photos/`, use it without web image research. Inspect ambiguous local files
   with Codex’s `view_image` tool. Keep user originals untouched.
2. If research surfaces online candidates but no approved photo, use the web
   tool’s `image_query` or `search_query`, then collect 2–3 image URLs with
   their source pages and what each shows. Ask which to use and stop. Do not
   download before approval.
3. If nothing suitable is confirmed, omit `coverImage`; the monogram tile is a
   valid state.

After approval, download the chosen image to a temporary path, convert it with
`sips -s format jpeg -s formatOptions 82 -Z 1200`, write it to
`public/covers/<tiktok-id>.jpg`, and set `coverImage` to the repo-relative path.

### 5. Fill sensible defaults

| Field | Default | Rule |
|---|---|---|
| `status` | `Idea` | Use unless the user supplied another exact value. |
| `priority` | infer or ask | Infer only when the framing signals intent; state the inference in the first report line. Ask when there is no signal. |
| `category` | infer | Use an existing category when it fits the subject. |
| `id` | kebab-case title | Check `public/data/china-2026.json` for uniqueness. It is permanent once written. |

### 6. Write the script

If research was done, put research notes in `script`:

```markdown
## What I found

- Confirmed facts and access reality.

## Open questions

- Anything not confirmed and where to check.
```

Do not write a hook, beats, or voiceover unless requested. If the user gave a
description, keep it verbatim above the notes, including unfinished wording.

### 7. Add a new city if needed

If `cityId` is not in `cities[]`, add `{ id, name, region }` using only a
confirmed city and region.

### 8. Write and validate

Append the object to `tiktoks` without reformatting or reordering unrelated
entries. Run:

```bash
npm run validate
```

If validation is red, fix the data before continuing. Do not commit or deploy
invalid data.

### 9. Ship it

After validation passes, use:

```bash
git add -A && git commit -m "<what changed and why>"
git push
npm run deploy
```

The deploy script validates and builds before publishing. Live site:
`https://mihainsto.github.io/place-research-app/`.

### 10. Report

Keep the report short and include:

- **Supplied by you** — fields taken verbatim.
- **Researched** — each confirmed fact with its opened source.
- **Couldn’t confirm** — omitted fields and where to check.

Then include the commit hash and live URL. Do not restate the JSON.

## Example

For “add the Shenzhen food drone delivery”, preserve Shenzhen and the subject,
research a specific named venue and one source, add `cityId: shenzhen` if
needed, use `status: Idea`, infer a fitting category, ask about priority if
there is no signal, and leave the cover blank or ask for approval among sourced
candidates.

## Related skills

- `$update-tiktok` — change an existing entry.
- `$add-cover` — attach a photo to an entry that already exists.
