# Instructions for the LLM

Paste everything between the rules below into your LLM when you want it to add
or edit TikToks. It is the whole contract.

The machine-readable version is [`schema/china-2026.schema.json`](../schema/china-2026.schema.json) —
attach that too if your tool supports it.

---

You maintain a JSON file that powers a TikTok planning app for a trip through
China in 2026. The file lives at `public/data/china-2026.json`. It is the only
source of truth — there is no database and no admin UI.

## The file

```json
{
  "project": { "name": "China 2026", "updatedAt": "2026-08-09" },
  "cities": [
    { "id": "chongqing", "name": "Chongqing", "region": "Southwest" }
  ],
  "tiktoks": [ ... ]
}
```

## A TikTok

```json
{
  "id": "chongqing-diarrhea-clinic",
  "title": "Chongqing Diarrhea Clinic",
  "cityId": "chongqing",
  "status": "Idea",
  "priority": "Must Film",
  "category": "Weird China",
  "coverImage": "https://example.com/cover.jpg",
  "location": {
    "name": "Jiefangbei Pedestrian Street, Yuzhong District",
    "appleMapsUrl": "https://maps.apple.com/?q=...",
    "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=...",
    "amapUrl": "https://uri.amap.com/search?keyword=..."
  },
  "references": [
    { "title": "The reel that started this idea", "url": "https://www.instagram.com/reel/XXXX/" }
  ],
  "script": "## Hook\n\n..."
}
```

### Field rules

| Field | Required | Rules |
|---|---|---|
| `id` | yes | kebab-case, unique. **This is the URL. Never change it once assigned** — changing it breaks saved links. |
| `title` | yes | How you'd say it out loud. |
| `cityId` | yes | kebab-case id of an entry in `cities`. Add the city there if it's new. |
| `status` | yes | Exactly one of: `Idea`, `Script`, `Ready to Film`, `Filmed`, `Editing`, `Posted` |
| `priority` | yes | Exactly one of: `Must Film`, `Good`, `Maybe` |
| `category` | yes | A short string. Prefer: `Weird China`, `Skyscraper View`, `Food`, `Urban`, `Architecture`, `Travel`, `Culture`, `Adventure`, `WTF`, `Hidden Gem`. Others are allowed but render in a neutral colour. |
| `coverImage` | no | Absolute URL, or a repo-relative path like `/covers/foo.jpg`. Omit if you don't have one — the app shows a designed placeholder, not a broken image. |
| `location` | no | `name` is the part that matters. Map URLs are optional; the app builds search links from the name + city when they're missing. |
| `references` | no | `{ title, url }`. `type` is optional — the app works it out from the URL. |
| `script` | no | Markdown. See below. |
| `createdAt`, `updatedAt` | no | ISO dates, e.g. `2026-08-09`. |

### The script field

**Everything written goes in `script`.** There are no separate fields for hook,
caption, shot list, filming notes, voiceover, or extra ideas — do not invent
any. Put it all in the script, structured with markdown:

```markdown
## Hook

The one line that opens the video.

## Beats

- Wide establishing shot
- Push in on the detail
- The reveal

## The line

> The quote that's actually the point.

## Notes to self

Light is best an hour before sunset. Backup plan if it's closed.
```

Headings render as small quiet labels, so use them freely as structure. The
script is read on a phone while standing at the location — write it to be
scanned, not admired.

## The timeline

The trip itself, one entry per day, at the top level next to `tiktoks`:

```json
"timeline": [
  { "date": "2026-09-12", "cityId": "shenzhen" },
  {
    "date": "2026-09-13",
    "cityId": "changsha",
    "train": { "departure": "12:00", "durationMinutes": 180 }
  }
]
```

| Field | Required | Rules |
|---|---|---|
| `date` | yes | ISO `YYYY-MM-DD`. One entry per day. **Never store the weekday** — the app derives it, and a stored one would eventually contradict the date. |
| `cityId` | yes | kebab-case id of a city in `cities`. Add the city if it's new. |
| `note` | no | One line — a flight, a booking, a plan for that day. |
| `train` | no | Train travel for the day: local `departure` time (`HH:MM`) and `durationMinutes`. The app calculates the arrival time and marks the day as lower filming time. |

Keep it sorted by date (the app sorts anyway). Duplicate dates are ignored with
a warning. The whole array is optional; no trip planned is a valid state.

The Timeline page joins this to the board automatically: each city's TikToks
become that leg's shot list, so you never list TikToks here.

## Rules

1. **Never change an existing `id`.** Rewrite the title freely; the id is permanent.
2. **Never invent new fields.** Unrecognised fields are ignored and flagged as
   probable typos.
3. **Use the exact enum spellings** for `status` and `priority`, including capitals.
4. **Every `cityId` must exist in `cities`.** Add the city if it's new.
5. **Don't reorder or reformat entries you weren't asked to touch.** The file is
   in git; keep diffs small.
6. When adding to an existing file, **return the complete file**, or a precise
   description of exactly where to insert the new object — not a fragment that
   silently drops the rest.

## After editing

Run `npm run validate`. It reports anything that would cost a TikTok, plus
warnings for things the app can recover from. Green means it's safe to commit.

---

## Prompts that work

> Add this to my China content database as a TikTok: [paste a link, an article,
> or a description]. Work out the city, give it a sensible category and
> priority, set status to Idea, and write a first-draft script.

> Update `chongqing-diarrhea-clinic` — I filmed it. Set status to Filmed and add
> a note at the end of the script about which shots I actually got.

> Add these three references to `shenzhen-huaqiangbei-teardown`: [urls]
