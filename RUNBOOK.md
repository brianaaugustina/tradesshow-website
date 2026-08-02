# The Trades Show — site runbook

Operational steps that live in dashboards, not in this repo. Nothing here can be
done by a build; each item is a click-path plus the exact command that proves it
worked.

Plan of record: `../tts-seo-implementation-plan.md`.

---

## 1. Domain redirects — T10 (Phase 1.6)

**Status: not done. Requires Vercel dashboard + registrar access (Decision 8).**

Everything the code now emits — canonicals, `og:url`, the sitemap — is absolute
and rooted at the apex host `https://thetradesshowpod.com` (`site` in
`astro.config.mjs`, `trailingSlash: 'never'`). Until the redirects below exist,
`www.` and the old domain are separate, competing copies of the site as far as
crawlers and assistants are concerned, and the canonical tag is doing the work
alone.

### 1a. `www.thetradesshowpod.com` → apex

1. Vercel → the project → **Settings → Domains**.
2. Confirm `thetradesshowpod.com` is set as the **primary** domain.
3. On `www.thetradesshowpod.com`, choose **Redirect to** `thetradesshowpod.com`
   with status **308** (permanent, method-preserving).
4. If `www` is not attached yet, add it first, then set the redirect. The DNS
   record is a `CNAME` to Vercel's target; the registrar's own "domain
   forwarding" feature is *not* a substitute (it usually 302s and drops the
   path).

Verify:

```bash
curl -sI https://www.thetradesshowpod.com | head -3
# → HTTP/2 308
# → location: https://thetradesshowpod.com/
curl -sI https://www.thetradesshowpod.com/some/deep/path | grep -i location
# → the path must survive the redirect
```

### 1b. `thetradesshow.co` → `thetradesshowpod.com`

**Gated on Decision 1: is the registration still held?**

- **If held:** add `thetradesshow.co` *and* `www.thetradesshow.co` to the same
  Vercel project, then set both to redirect (301/308) to
  `https://thetradesshowpod.com`. Legacy press mentions and directory listings
  currently dead-end there; the redirect converts them into links that count.
- **If lapsed:** record that here and move on. Do not re-purchase for SEO alone
  unless an audit of the legacy press links says the recovered equity is worth
  it.

Verify (only once the domain is attached):

```bash
curl -sI https://thetradesshow.co      | head -3   # → 301/308 → thetradesshowpod.com
curl -sI https://www.thetradesshow.co  | head -3   # → same
```

Note: the `episode-description` skill already canonicalises on
`thetradesshowpod.com` and never emits `thetradesshow.co`, so no published
content needs editing — this is purely about inbound legacy links.

### 1c. Do NOT express these as `vercel.json` redirects

`vercel.json` redirects run *inside* a deployment, after the request has already
been routed to the project — they cannot move a request from one hostname's
canonical origin to another the way domain-level redirects do, and adding both
tends to produce redirect chains. Keep hostname redirects in **Settings →
Domains**. `vercel.json` becomes relevant only in Phase 2, for per-URL redirects
when a published episode slug is ever renamed.

---

## 2. Sitemap + Search Console

Shipped in this repo (Phase 1.1): `@astrojs/sitemap` generates
`/sitemap-index.xml` at build, and `public/robots.txt` points at it. AI crawlers
(GPTBot, ClaudeBot, PerplexityBot) are deliberately **not** blocked.

Still a dashboard task:

1. Verify a Google Search Console property for `thetradesshowpod.com` (DNS TXT
   record at the registrar — use the *domain* property so `www` and apex are
   covered together).
2. **Sitemaps → Add a new sitemap →** `sitemap-index.xml`. Confirm status
   "Success" and a non-zero discovered-URL count.
3. Re-submit after each phase that adds routes (Phase 2 episode pages, Phase 3
   guest pages, Phase 4 landing pages).

Verify after any deploy:

```bash
curl -s https://thetradesshowpod.com/robots.txt
curl -s https://thetradesshowpod.com/sitemap-index.xml | xmllint --noout - && echo OK
curl -s https://thetradesshowpod.com | grep -E 'canonical|og:image|og:url'
```

---

## 3. Entity consistency with The Corral

`src/lib/entity.ts` and
`the-corral-v2/src/lib/site-jsonld.ts` ship the **same** `Person`
(Briana Ottoboni): same `name`, same `sameAs` array, string for string. They are
two files in two repos with no shared build, so this only holds if it is checked
by hand.

Check after either site deploys:

```bash
curl -s https://thetradesshowpod.com | grep -o '"Person".*' | head -1
curl -s https://artisancorral.com    | grep -o '"Person".*' | head -1
# the name + sameAs values must match exactly
```

Two open items, both tracked on the Corral side — do not "fix" either one
unilaterally:

- **LinkedIn URL.** Both live sites and both schema blocks use
  `https://www.linkedin.com/in/brianaottoboni/`. The Corral's
  `src/components/about/FounderNote.tsx` links `/in/briana-ottoboni` instead.
  One of the two is wrong; reconcile on the Corral side, then confirm nothing
  here needs to change.
- **Canonical bio string (Decision 5).** Neither `Person` node carries a
  `description` yet, on purpose. When the one-sentence bio is signed off, add it
  to **both** files in the same change.

---

## 4. Open decisions blocking later phases

| # | Decision | Blocks |
|---|---|---|
| 1 | Is `thetradesshow.co` still registered? | §1b above |
| 2 | Nav link set sign-off | Phase 4 (T12) |
| 3 | Homepage card link behaviour | **resolved, shipped in Phase 2.7** — see §5 |
| 4 | Confirm the show's live IG handle is `@tradesshow` (double-s) | shipped as `@tradesshow`; correct here if wrong |
| 5 | Canonical bio string | §3 above |
| 6 | Which EP1–9 Descript projects still have exportable transcripts | Phase 3 |
| 7 | Press-page audience figures (social-first, no vanity aggregates) | Phase 4 `/press` |
| 8 | Vercel + registrar dashboard access | §1, §2 |

---

## 5. Episode pages — what shipped, and what is still missing

Shipped in Phase 2: `src/content/episodes/ep-10…15.md` (the collection is the
source of truth), `/episodes`, `/episodes/[slug]`, per-episode
`PodcastEpisode` + `VideoObject` + guest `Person` JSON-LD, and the homepage
link repoint. Re-submit the sitemap in GSC (§2) — it now carries seven new URLs.

**Homepage card behaviour as shipped (Decision 3, both halves):** the card
*title* links to `/episodes/{slug}`; the "Listen on Spotify" button keeps its
label and now carries the **real per-episode** Spotify URL, so the label is
true. Both hrefs come from the collection, and an episode with no collection
file falls back to exactly the old behaviour (no title link, Spotify show URL).
Nothing else about the cards changed — the live-refresh script reads the same
map from `<script type="application/json" id="episode-links">`.

**Still missing on every S2 page, and deliberately blank rather than invented:**

| Gap | Why | To close |
|---|---|---|
| **Pull-quotes (0 of the plan's 3–5) — BLOCKS the Phase 2 exit criterion** | No cleaned transcript exists on disk for EP10–15 (each `.md`'s `transcriptSource` reads "Descript project (final post-manual-pass export) — no local export on disk"), and a quote nobody said is worse than no quote | Export the final post-manual-pass transcript from each Descript project, then lift 3–5 verbatim (the social-clips mining pass already picks the best moments — reuse its selects) |
| Transcript section | Same; `transcriptAvailable: false` on all six, so the section does not render | Paste the cleaned export as a `## Transcript` section in the episode's `.md` and flip the flag |
| `seoTitle` on EP10 and EP11 | No Content DB "Full Video" row with a YouTube-title variant | Add the field if/when one is written; the page falls back to the Spotify title |
| Nav route to `/episodes` | The nav link set is gated on Decision 2 (Phase 4) | Add "Episodes" to `Navbar.astro` once the set is signed off. Until then the archive is reachable from the homepage cards, from every episode page, and from the sitemap |

**Phase 2 exit status — needs Briana's call.** The plan's exit criterion reads
"Every episode page: … ≥3 pull-quotes", and the plan's explicit escape hatch
covers only the transcript ("full transcript (or explicitly deferred)"), not
pull-quotes. So Phase 2 is code-complete but **content-incomplete by its own
criteria**. Two ways to close it, both hers to pick: (a) run the Descript export
pass above and fill `pullQuotes` on all six, or (b) sign off on shipping the
episode pages without them and amend the criterion. Nothing in the template
needs to change either way — the section renders the moment real quotes land in
frontmatter.

`corralTradeUrl` uses The Corral's `?q=` jobs-board deep link; re-point to the
trade page once the Corral's C2 trade routes ship.

---

## 6. Phase 3 — guest pages + the Season 1 backfill

Shipped: `src/content/episodes/ep-01…09.md` (T11 complete — all 15 episodes now
have pages), `/guests`, `/guests/[slug]` (14 pages), guest `ProfilePage` +
`Person` JSON-LD, and the Corral cross-links in both directions. Re-submit the
sitemap in GSC (§2) — it now carries 24 more URLs.

### 6a. What was verified before it was written down

Nothing in the S1 files was taken on trust from the manifest:

- **Spotify episode ids (9/9)** re-checked against `open.spotify.com/oembed`;
  every returned title carries the matching `N.` prefix.
- **YouTube video ids (9/9)** re-checked against `youtube.com/oembed`; every one
  returns `author_name: "The Trades Show"` and the matching episode number.
- **Corral artisan profiles** `curl`ed one at a time. **10 of 15 exist**
  (EP1, 3, 4, 5, 6, 9, 12, 13, 14, 15). Five 404: Angela Wilson, Cynthia
  Alberto, Marsha Trattner, Stuart Brioza, and Briana herself. Those files carry
  no `corralArtisanUrl` and the link does not render. Amanda Luu's profile is a
  **joint** record (`/artisans/amanda-luu-ivanka-matsuba`), which is exactly why
  the field is written down per episode rather than derived from `guestSlug`.
- **Guest links** all resolve (three return `429` — Shopify rate-limiting, not a
  dead link: ianjamesmade.com, mmclay.com, oftenwander.com).

### 6b. Open items

| # | Item | Why it is open | To close |
|---|---|---|---|
| A | **Pull-quotes: 0 of 15 episodes, so 0 of 14 guest pages show quotes** | Same cause as Phase 2 — no cleaned transcript exists on disk for **any** episode, S1 or S2. The plan's own words: quotations lift citation rates most for low-DR domains, so this is the single highest-value gap left on both phases | Export the final post-manual-pass transcript per episode, lift 3–5 verbatim into `pullQuotes`. Guest pages show the best 3 across appearances automatically |
| B | **Transcripts: `transcriptAvailable: false` on all 15** | Same. For EP1–9 the fallback is the YouTube auto-caption track (`yt-dlp --write-auto-sub`) plus a cleanup pass — an un-cleaned ASR dump does not go on the page | Paste the cleaned export as a `## Transcript` section and flip the flag |
| C | **`seoTitle` on every S1 page** | The only alternative headline that exists for S1 is the YouTube title, and several are wrong as published: EP3 reads "MAKE BEAUTIFUL **THING**" (typo) and EP5 ends "\| Ep **3**" (wrong episode number). Shipping either as a `<title>` would publish the error onto this site | Fix the YouTube titles at the source, then add `seoTitle`. Until then every S1 page falls back to the clean Spotify title |
| D | **Guest name spelling — EP8** | The published episode title says "**Marcia** Trattner". Her own site (she-weld.com) and this episode's own published chapter list say "**Marsha**". The files use *Marsha* for the guest name and the slugs (`marsha-trattner`, `marsha-trattner-blacksmith`). `title` stays verbatim as published (it is what the podcast platforms carry and what `PodcastEpisode.name` is matched against), and a `displayTitle` with the one letter corrected is what the site actually prints — H1, archive row, guest-page row, `<title>`. **So nothing on the site misspells her name; only the JSON-LD `name` still carries the published string.** The underlying question is still open | Confirm with her, then fix the title on Spotify/Apple/YouTube, copy it into `title` and delete `displayTitle`, **or** delete `displayTitle` and flip the name and both slugs back. Nothing is deployed yet, so the URL is still free to move — after deploy it needs a `vercel.json` redirect |
| E | **`corralTradeUrl` on trades the board has no listings for** | The `?q=` deep link is the shipped convention (S2 uses `?q=chef`, `?q=florist`, `?q=plaster`), but the board today only carries wood/cabinet, jewelry, tailoring, watchmaking, luthier, upholstery and sign-painting work. `?q=butcher`, `?q=weaving`, `?q=candle`, `?q=ceramic`, `?q=shoe` land on an empty board | Re-point all 15 to the Corral's trade landing pages once C2 ships — that was always the plan (§2.1 frontmatter note) |
| F | **Nav still does not reach `/episodes` or `/guests`** | Gated on Decision 2 (Phase 4) | `/guests` is reachable from every episode page and from `/episodes`; `/episodes` from the homepage cards and every guest page. Both are in the sitemap. Add the nav links once the set is signed off |

### 6c. Design decisions worth not re-litigating

- **Guests are derived from the episode collection, not a second collection.**
  The two genuinely guest-level fields (`studio`, `corralArtisanUrl`) were added
  to the episode schema instead. One place a guest's name is spelled; nothing to
  keep in sync. `src/lib/guests.ts` does the grouping and already handles a
  repeat guest (union the links, newest appearance wins the scalars) even though
  no guest has one yet.
- **The host has no guest page.** EP10 is solo; a `/guests/briana-ottoboni` page
  would mint `#guest-briana-ottoboni` next to the `#briana` node every page
  already carries — two thin entities for one person, which is the exact failure
  the entity spine exists to prevent. 14 guest pages, 15 episodes.
- **Guest `Person` `@id`s are shared** between the episode page and the guest
  page (`…/#guest-<slug>`), so the two pages describe one person rather than
  two. Verify with
  `curl -s https://thetradesshowpod.com/guests/jefferson-mack | grep -o '#guest-jefferson-mack'`
  and the same on `/episodes/jefferson-mack-blacksmith`.
- **The definitional lead on a guest page is generated from frontmatter**
  ("X is a blacksmith in San Francisco, CA, working out of Mack Metal."). The
  substantive paragraph under it is the episode's own hand-written summary. No
  guest bio was written from nothing — the show notes describe a conversation,
  not a person.
