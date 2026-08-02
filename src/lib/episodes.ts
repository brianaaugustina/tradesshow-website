/**
 * Episode plumbing: URLs, display formatting, the homepage join, and the
 * per-episode JSON-LD (T3's episode half, plan §2.6).
 *
 * Like `entity.ts`, none of this renders a pixel of its own — it produces the
 * hrefs the existing homepage cards point at, and the `@graph` the episode
 * pages put in `<head>`.
 */

import { getCollection, type CollectionEntry } from "astro:content";
import { SITE_URL, PODCAST_ID, ORG_ID, BRIANA_ID } from "./entity";

export type EpisodeEntry = CollectionEntry<"episodes">;
export type EpisodeData = EpisodeEntry["data"];

/** The archive route. One constant so the index, the cards and the schema agree. */
export const EPISODES_PATH = "/episodes";

/** `trailingSlash: 'never'` — these strings are also canonicals and sitemap <loc>s. */
export const episodePath = (slug: string) => `${EPISODES_PATH}/${slug}`;
export const episodeAbsoluteUrl = (slug: string) => `${SITE_URL}${episodePath(slug)}`;

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Newest first, the order both the archive and the homepage think in. */
export async function getEpisodesNewestFirst(): Promise<EpisodeEntry[]> {
  const episodes = await getCollection("episodes");
  return episodes.sort((a, b) => b.data.episodeNumber - a.data.episodeNumber);
}

/** Seasons newest first, episodes newest first inside each. */
export async function getEpisodesBySeason(): Promise<
  { season: number; episodes: EpisodeEntry[] }[]
> {
  const episodes = await getEpisodesNewestFirst();
  const seasons = [...new Set(episodes.map((e) => e.data.season))].sort((a, b) => b - a);
  return seasons.map((season) => ({
    season,
    episodes: episodes.filter((e) => e.data.season === season),
  }));
}

/* -------------------------------------------------------------------------- */
/* Homepage join (plan §2.7)                                                   */
/* -------------------------------------------------------------------------- */

export interface EpisodeCardLinks {
  /** Site-relative episode page. */
  url: string;
  /** The REAL per-episode Spotify URL, so the card's "Listen on Spotify" stays true. */
  spotifyUrl: string;
}

/**
 * `episodeNumber → links`, keyed by string because this same object is
 * serialized into the page for NowPlaying's live-refresh script to read.
 *
 * Episode number is the join key between RSS items, Content DB rows and
 * collection entries (plan §2.3) — `rss.ts` already parses it out of the feed
 * title. A number with no entry is simply absent, and every consumer must fall
 * back to today's behaviour (Spotify *show* URL, no episode link).
 */
export async function getEpisodeCardLinks(): Promise<Record<string, EpisodeCardLinks>> {
  const episodes = await getCollection("episodes");
  const map: Record<string, EpisodeCardLinks> = {};
  for (const { data } of episodes) {
    map[String(data.episodeNumber)] = {
      url: episodePath(data.slug),
      spotifyUrl: data.spotifyEpisodeUrl,
    };
  }
  return map;
}

/* -------------------------------------------------------------------------- */
/* Display helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * UTC on purpose: a date-only `pubDate` parses to midnight UTC, and formatting
 * it in the build machine's zone would print the previous day west of Greenwich.
 */
export function formatEpisodeDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The headline to PRINT for an episode, anywhere on this site.
 *
 * Almost always `title` verbatim. `displayTitle` overrides it only where the
 * published title carries a mistake this site refuses to repeat (ep-08's
 * misspelled guest name). The JSON-LD below deliberately does NOT use this —
 * `PodcastEpisode.name` stays the string the podcast platforms carry, so the
 * episode still resolves to one entity across Spotify, Apple and YouTube.
 */
export const episodeHeadline = (data: EpisodeData) => data.displayTitle ?? data.title;

/** "PT1H4M10S" → "1 hr 4 min". Seconds are noise at this size. */
export function humanDuration(iso: string): string {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return "";
  const hours = Number(m[1] ?? 0);
  const minutes = Number(m[2] ?? 0);
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(" ") || `${Number(m[3] ?? 0)} sec`;
}

/** "San Francisco, CA" → the two fields schema.org's PostalAddress wants. */
function splitCity(city: string): { locality: string; region?: string } {
  const [locality, region] = city.split(",").map((s) => s.trim());
  return { locality, region: region || undefined };
}

/* -------------------------------------------------------------------------- */
/* JSON-LD — T3, episode half (plan §2.6)                                      */
/* -------------------------------------------------------------------------- */

/** Guest `@id`s are stable and site-wide so Phase 3's guest pages reuse them. */
export const guestId = (guestSlug: string) => `${SITE_URL}/#guest-${guestSlug}`;

/**
 * Guest-page URLs live HERE, next to `guestId`, rather than in `guests.ts`
 * where the rest of the guest code sits: `guests.ts` imports this module, so
 * putting them there and importing them back would be a cycle. `guests.ts`
 * re-exports them, so page components still only import one module.
 */
export const GUESTS_PATH = "/guests";
export const guestPath = (guestSlug: string) => `${GUESTS_PATH}/${guestSlug}`;
export const guestAbsoluteUrl = (guestSlug: string) => `${SITE_URL}${guestPath(guestSlug)}`;

/**
 * `PodcastEpisode` + `VideoObject` + the guest `Person`.
 *
 * The series, the organisation and Briana are NOT restated here — they are
 * `@id` references into the base graph BaseLayout already emits on every page.
 * Restating them is how two sites (or two pages) end up describing two
 * different shows.
 */
export function episodeJsonLd(data: EpisodeData): object {
  const url = episodeAbsoluteUrl(data.slug);
  const watchUrl = youtubeWatchUrl(data.youtubeVideoId);
  const datePublished = data.pubDate.toISOString().slice(0, 10);

  const nodes: object[] = [
    {
      "@type": "PodcastEpisode",
      "@id": `${url}#episode`,
      url,
      name: data.title,
      description: data.summary,
      episodeNumber: data.episodeNumber,
      partOfSeason: {
        "@type": "PodcastSeason",
        name: `The Trades Show — Season ${data.season}`,
        seasonNumber: data.season,
        partOfSeries: { "@id": PODCAST_ID },
      },
      partOfSeries: { "@id": PODCAST_ID },
      datePublished,
      duration: data.duration,
      image: data.thumbnail,
      // The distribution surface this episode actually plays on. `contentUrl`
      // is the per-episode Spotify link, never the show URL.
      associatedMedia: {
        "@type": "MediaObject",
        contentUrl: data.spotifyEpisodeUrl,
        encodingFormat: "audio/mpeg",
      },
      author: { "@id": BRIANA_ID },
      creator: { "@id": BRIANA_ID },
      publisher: { "@id": ORG_ID },
      ...(data.soloEpisode
        ? {}
        : {
            about: { "@id": guestId(data.guestSlug) },
            contributor: { "@id": guestId(data.guestSlug) },
          }),
    },
    {
      // What makes the video eligible for video results from HER domain rather
      // than only from youtube.com (T5).
      "@type": "VideoObject",
      "@id": `${url}#video`,
      name: data.seoTitle ?? data.title,
      description: data.summary,
      thumbnailUrl: data.thumbnail,
      uploadDate: datePublished,
      duration: data.duration,
      embedUrl: youtubeEmbedUrl(data.youtubeVideoId),
      contentUrl: watchUrl,
      url,
      publisher: { "@id": ORG_ID },
      creator: { "@id": BRIANA_ID },
    },
  ];

  if (!data.soloEpisode) {
    const { locality, region } = splitCity(data.city);
    // Only the guest's own published surfaces — the same rule the show's own
    // `sameAs` follows: if the page doesn't link it, schema doesn't claim it.
    // The Corral profile is in here because it is `curl`-verified and the page
    // links it; guest pages build the identical list (`guestSameAs`).
    const sameAs = data.guestLinks.map((l) => l.url);
    if (data.corralArtisanUrl) sameAs.push(data.corralArtisanUrl);

    nodes.push({
      "@type": "Person",
      "@id": guestId(data.guestSlug),
      name: data.guest,
      // The guest's own page on this site (Phase 3/T4). Same `@id` there, so
      // the two pages describe one person rather than minting a second.
      url: guestAbsoluteUrl(data.guestSlug),
      jobTitle: data.trade,
      homeLocation: { "@type": "Place", name: data.city },
      address: {
        "@type": "PostalAddress",
        addressLocality: locality,
        ...(region ? { addressRegion: region } : {}),
        addressCountry: "US",
      },
      ...(data.studio
        ? { worksFor: { "@type": "Organization", name: data.studio } }
        : {}),
      ...(sameAs.length ? { sameAs } : {}),
      subjectOf: { "@id": `${url}#episode` },
    });
  }

  return { "@context": "https://schema.org", "@graph": nodes };
}

/** `/episodes` — cheap, and it tells a crawler the archive is a list, not prose. */
export function episodesIndexJsonLd(episodes: EpisodeEntry[]): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${EPISODES_PATH}#page`,
        url: `${SITE_URL}${EPISODES_PATH}`,
        name: "Episodes — The Trades Show",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": PODCAST_ID },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}${EPISODES_PATH}#list`,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: episodes.length,
        itemListElement: episodes.map((entry, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: episodeAbsoluteUrl(entry.data.slug),
          name: entry.data.title,
        })),
      },
    ],
  };
}
