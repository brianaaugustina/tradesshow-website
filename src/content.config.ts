import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * The `episodes` collection — the SOURCE OF TRUTH for everything under
 * `/episodes` (plan §2.1, the "hybrid" option).
 *
 * The Anchor RSS feed cannot back these pages: it carries no per-episode
 * Spotify link, no YouTube id, no transcript, no chapters, no stable slug. So
 * the feed keeps its one existing job — the homepage's build-time + live
 * "Now Playing" refresh, untouched — and this collection owns the episode
 * pages plus the card *links* the homepage resolves against it (§2.7).
 *
 * An episode with no file here simply has no page; the homepage still shows it
 * from RSS and its card falls back to the Spotify show URL. That is the whole
 * fallback contract — nothing here may become required for the homepage to
 * render.
 *
 * Every value in a file under `src/content/episodes/` is COMPILED FROM AN
 * UPSTREAM ARTIFACT (the published RSS item, the Content DB row's Title and
 * Description blocks, the Spotify/YouTube share links). Nothing is written
 * from memory: a chapter timestamp or a pull-quote that was not published
 * somewhere first does not go in a file.
 */
const episodes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/episodes" }),
  schema: z.object({
    /**
     * Hand-set and IMMUTABLE once published (plan §2.2). Never derived from the
     * title — a retitled episode must keep its URL. Renaming one requires a
     * `redirects` entry in `vercel.json`.
     */
    slug: z.string(),
    episodeNumber: z.number().int().positive(),
    season: z.number().int().positive(),
    /** Spotify title with the leading "NN. " stripped; `episodeNumber` carries that. */
    title: z.string(),
    /**
     * The headline THIS SITE prints, when the published title carries an error
     * this site is not going to repeat. `title` stays verbatim — it is the
     * string Spotify/Apple/YouTube listings carry, and the string
     * `PodcastEpisode.name` is matched against — while `displayTitle` is what
     * the H1, the archive row, the guest-page row and `<title>` render.
     *
     * SET IT ONLY TO CORRECT A PUBLISHED MISTAKE, never to rewrite a title for
     * taste or keywords (that is what `seoTitle` is for). One file uses it:
     * ep-08.md, whose published title misspells the guest's own name — see the
     * TODO there and RUNBOOK §6b item D.
     */
    displayTitle: z.string().optional(),
    /**
     * `<title>`/OG headline. The Content DB row's YouTube title where one
     * exists — that is the keyword-first, ~100-char discoverability variant,
     * already written. Falls back to `title` when the row predates the
     * convention.
     */
    seoTitle: z.string().optional(),
    guest: z.string(),
    /** Joins to /guests/[slug] in Phase 3; already the guest Person's @id key. */
    guestSlug: z.string(),
    trade: z.string(),
    city: z.string(),
    pubDate: z.coerce.date(),
    /**
     * 40–80 words, and the first thing on the page after the H1 (T1): it must
     * name the guest, the trade and the city as plain text. Condensed from the
     * published show notes — a summary of them, never new facts.
     */
    summary: z.string(),
    spotifyEpisodeUrl: z.string().url(),
    youtubeVideoId: z.string(),
    applePodcastsUrl: z.string().url().optional(),
    /** ISO 8601, from the feed's itunes:duration. Feeds PodcastEpisode + VideoObject. */
    duration: z.string(),
    /** Episode art from the feed's itunes:image — also this page's OG image. */
    thumbnail: z.string().url(),
    /**
     * Guest quotations, verbatim from a cleaned transcript. EMPTY IS CORRECT
     * until a transcript exists — the section does not render, and a
     * plausible-sounding quote nobody said is worse than no quote at all.
     */
    pullQuotes: z
      .array(z.object({ quote: z.string(), timestamp: z.string().optional() }))
      .default([]),
    /** Verbatim from the Content DB row / published show notes. Never re-timed. */
    chapters: z.array(z.object({ time: z.string(), title: z.string() })).default([]),
    guestLinks: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    /**
     * The shop/label/atelier the guest works out of, named in the published
     * show notes. Guest-level, not episode-level, but it lives here because the
     * `guests` view model is derived from these files rather than from a second
     * collection that could drift out of sync (see src/lib/guests.ts).
     *
     * OMITTED, not guessed, when the notes name no single business — a guest
     * who trades under their own name (Ian James) or whose notes list three
     * restaurants has no one "studio" to state.
     */
    studio: z.string().optional(),
    /** Cross-venture bridge. `?q=` is the Corral jobs board's own deep-link contract. */
    corralTradeUrl: z.string().url().optional(),
    /**
     * The guest's profile on The Corral — the other half of the cross-venture
     * bridge (plan §2.5 item 6, §3.1).
     *
     * SET ONLY AFTER `curl`ing the URL and confirming a 200 whose <title> names
     * this guest. It is NOT derivable from `guestSlug`: The Corral slugs its
     * own records independently, and Amanda Luu's profile is a joint one
     * (`amanda-luu-ivanka-matsuba`). Five of the fifteen guests have no profile
     * at all; those files simply omit this field and the link does not render.
     */
    corralArtisanUrl: z.string().url().optional(),
    /**
     * False ships the page WITHOUT a transcript section, which is the correct
     * outcome for an unverified one — a garbled ASR dump on the page is worse
     * than an absent one (plan §2.4).
     */
    transcriptAvailable: z.boolean().default(false),
    /** Host-only episode: no guest Person node, no guest-vs-host distinction to draw. */
    soloEpisode: z.boolean().default(false),
  }),
});

export const collections = { episodes };
