---
name: update-tiktok
description: Change an existing TikTok on the China 2026 board — move its status, change priority, add references or a location, rewrite or append to the script. Use for "I filmed the diarrhea clinic", "bump the gas station to must film", "add this reel to Hongyancun", "posted the tea queue video", or any edit to an entry that already exists.
---

# Update a TikTok

Edits one existing entry in `public/data/china-2026.json`.

## Rules

**Never change an `id`.** It's the permalink. If the title changes, the id
stays. This is the only irreversible mistake available here.

**Change only what was asked.** Don't tidy neighbouring entries, don't
reformat, don't "fix" fields you weren't asked about. The diff should be the
edit and nothing else.

**Append to scripts, don't overwrite.** Unless the user explicitly says
"rewrite" or "replace", add to the end rather than replacing what's there.
Their script is their writing.

**Don't invent.** Same as always — an omitted field beats a guessed one. If
they say "add the location" and you can't confirm it, ask rather than fill it.

## Finding the entry

The user will say a name, not an id. Match loosely against `title` and `id` in
the data file. If two entries could match, ask which. If none matches, say so —
don't create one; that's `/add-tiktok`.

## Common edits

**Status moves.** `Idea → Script → Ready to Film → Filmed → Editing → Posted`.
Use the exact spelling. "I filmed it" means `Filmed`, "it's up" means `Posted`.

When something moves to `Filmed` or later, it's worth asking whether to append
a note to the script about what actually got shot — that's the detail they'll
want in the edit and will otherwise forget. Ask; don't write it for them.

**Priority.** `Must Film`, `Good`, `Maybe`. Exact spelling.

**Adding a reference.** Append `{ title, url }` to `references`. Give it a
title that says what it is — the place or subject name works well, because the
app already shows the platform label and hostname beside it. Never a bare URL
as the title.

**Adding or fixing a location.** `name` is the field that matters — the app
derives Apple and Google Maps search links from it plus the city. Only set
`appleMapsUrl` / `googleMapsUrl` / `amapUrl` when you have a real, specific
link (a shared pin, a place URL). A search URL you built by hand adds nothing
the app wasn't already doing.

If the user asks you to *find* a location they don't have, that's research —
follow the research and never-invent rules in `/add-tiktok`.

**Moving a TikTok to a different city.** Change `cityId`, and add the city to
`cities[]` if it's new.

## Finish

```bash
npm run validate
```

Then say what changed, in one line per field. Nothing else.
