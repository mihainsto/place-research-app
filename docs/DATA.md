# The data layer

How JSON becomes the app, and what happens when the JSON is wrong.

## Where things live

```
public/data/china-2026.json      the source of truth — edit this
schema/china-2026.schema.json    generated; what the LLM is given
src/data/schema.ts               Zod definitions (the real source of truth)
src/data/normalize.ts            raw JSON → canonical objects
src/data/load.ts                 the fetch
src/data/indexes.ts              maps + counts, built once
```

## Two schemas, on purpose

`src/data/schema.ts` defines the same data twice, and the split is deliberate.

**Raw / permissive** — used at runtime. Almost everything is optional. Its only
job is to guarantee the shape is safe to work with.

**Authoring / strict** — never used at runtime. It generates the JSON Schema and
powers `npm run validate`.

The reason: be strict where a human is sitting at a keyboard and can fix it, and
forgiving where a user is standing in a street in Chongqing trying to read a
script. A missing `category` should be a warning in your terminal, not a blank
screen in the field.

## What normalization does for you

The LLM doesn't have to get these right, because `normalize.ts` derives them:

| Missing | What happens |
|---|---|
| `id` | Slugified from the title |
| `cities[]` entry | The city is synthesised from `cityId` |
| `cityId` and `city` both absent | Filed under "Unassigned" + warning |
| `reference.type` | Derived from the URL hostname |
| `appleMapsUrl` / `googleMapsUrl` | Search URLs built from location name + city |
| `coverImage` relative path | Prefixed with `/` so `/public` files work |
| unknown `status` / `priority` | Falls back to `Idea` / `Maybe` + warning |
| `city: "Chongqing"` instead of `cityId` | Accepted and slugified |

## The one rule: never drop a TikTok silently

Among 200 cards you would never notice one missing. So:

- A bad enum **falls back**.
- A bad reference is **dropped individually**, and the TikTok survives.
- An unknown `cityId` **synthesises a city** rather than orphaning the entry.
- Unrecognised fields are **reported as probable typos**, not rejected.

The only thing that removes a TikTok entirely is a missing or blank `title` —
there'd be nothing left to render or search by.

Every one of those decisions is recorded as a `DataIssue` and surfaces in the
**Data health** dialog (sidebar footer, only visible when something is wrong)
and in `npm run validate`.

## Commands

```bash
npm run validate    # check the data file — run before every commit
npm run schema      # regenerate schema/china-2026.schema.json from Zod
npm run stress 240  # generate a synthetic dataset to test scale
```

## Growing past one file

`src/data/load.ts` is the only module that knows where the data comes from. If
the file ever gets uncomfortably large, shard it into `public/data/cities/*.json`
plus a manifest and change that one file. Nothing else in the app cares.
