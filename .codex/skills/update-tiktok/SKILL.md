---
name: update-tiktok
description: Change an existing TikTok on the China 2026 board—status, priority, references, location, city, or script. Use when the user says they filmed or posted an entry, wants a priority change, supplies a new reel, or asks for any edit to an existing entry in public/data/china-2026.json.
---

# Update a TikTok

Edit one existing entry in `public/data/china-2026.json`.

## Rules

**Never change an `id`.** It is the permalink. If the title changes, keep the
id unchanged; changing it breaks saved links.

**Change only what was asked.** Do not tidy neighboring entries, reformat the
file, or fix unrelated fields. Keep the diff limited to the requested edit.

**Append to scripts; do not overwrite.** Replace or rewrite only when the user
explicitly asks. Their script is their writing.

**Do not invent.** If the user asks to add a location or reference and it
cannot be confirmed, research it or ask; never fill it with a plausible guess.

## Finding the entry

Match the user’s name loosely against both `title` and `id` in the data file. If
two entries could match, ask which one. If none matches, say so and do not
create an entry; `$add-tiktok` handles new entries.

## Common edits

### Status

Use the exact sequence and spelling:

`Idea → Script → Ready to Film → Filmed → Editing → Posted`

Interpret “I filmed it” as `Filmed` and “it’s up” as `Posted`. When an entry
moves to `Filmed` or later, ask whether to append a note about what was shot;
do not invent that note.

### Priority

Use exact values: `Must Film`, `Good`, or `Maybe`.

### References

Append `{ title, url }` to `references`. Use a descriptive title, not a bare
URL. If the user provides a reference, open it with the Codex web tool before
claiming what it contains. Only add URLs that were actually opened and
confirmed to be about the entry.

### Location

`location.name` is the important field: the app derives Apple and Google Maps
search links from it plus the city. Set `appleMapsUrl`, `googleMapsUrl`, or
`amapUrl` only when the user supplied or research confirmed a specific place or
shared-pin URL. A hand-built search URL adds nothing.

If the user asks you to find an unknown location, follow `$add-tiktok`’s
research and never-invent rules.

### City

When moving an entry to another city, change `cityId` and add the city to
`cities[]` if it is new. Keep city ids kebab-case and use confirmed names.

## Finish

Run:

```bash
npm run validate
```

If validation is red, fix it before continuing; do not commit or deploy invalid
data.

Once green, use the project ship sequence:

```bash
git add -A && git commit -m "<what changed and why>"
git push
npm run deploy
```

The deploy script validates and builds before publishing. Live site:
`https://mihainsto.github.io/place-research-app/`.

Report what changed, one line per field, plus the commit hash.
