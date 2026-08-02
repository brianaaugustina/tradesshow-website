/**
 * Guest plumbing — the `/guests` half of Phase 3 (plan §3.1 / T4).
 *
 * WHERE GUEST DATA LIVES. The plan offered two shapes: a second
 * `src/content/guests/` collection, or "derive from episode frontmatter + a
 * small guest file for extras". This is the derived shape, and the reason is
 * drift: a guest's trade, city, studio and links are already stated in the
 * episode file, that file is what the episode page renders, and a second copy
 * in a second collection is a copy that can disagree with the first. The only
 * genuinely guest-level facts (`studio`, `corralArtisanUrl`) were added to the
 * episode schema instead, so there is exactly one place a guest's name is
 * spelled and one place their Corral profile URL is written down.
 *
 * The cost of that choice is the merge below: a guest who appears twice has two
 * files, so links are unioned and the newest appearance wins for the scalars.
 * No guest has a second appearance yet; the merge exists so the first one does
 * not silently drop half the data.
 *
 * Like `episodes.ts`, nothing here renders a pixel of its own.
 */

import { getCollection } from "astro:content";
import { SITE_URL, ORG_ID, PODCAST_ID } from "./entity";
import {
  episodeAbsoluteUrl,
  episodePath,
  guestId,
  GUESTS_PATH,
  guestPath,
  guestAbsoluteUrl,
  type EpisodeEntry,
} from "./episodes";

// URL helpers live in episodes.ts (next to `guestId`) to avoid an import cycle;
// re-exported so a page component imports one module, not two.
export { GUESTS_PATH, guestPath, guestAbsoluteUrl };

/** A pull-quote carries its episode with it — a quote with no source is a rumour. */
export interface GuestQuote {
  quote: string;
  timestamp?: string;
  episodeSlug: string;
  episodeNumber: number;
}

export interface Guest {
  slug: string;
  name: string;
  trade: string;
  city: string;
  studio?: string;
  links: { label: string; url: string }[];
  corralArtisanUrl?: string;
  corralTradeUrl?: string;
  /** Newest first. Never empty — a guest exists only because an episode names them. */
  episodes: EpisodeEntry[];
  /** Episode art from the most recent appearance; the only guest image that exists. */
  thumbnail: string;
  /**
   * Best quotes across appearances, capped at the plan's three. EMPTY IS THE
   * CURRENT, CORRECT STATE: no episode has a cleaned transcript on disk yet, so
   * every `pullQuotes` is `[]` and the section simply does not render.
   */
  quotes: GuestQuote[];
}

/** The plan's "their best 3 quotes across appearances". */
const MAX_QUOTES = 3;

/**
 * One entry per guest, ordered by most recent appearance.
 *
 * SOLO EPISODES ARE EXCLUDED. EP10 is Briana alone, and her `guestSlug` would
 * mint `#guest-briana-ottoboni` — a second Person node for the same human, next
 * to the `#briana` node every page already emits. Two thin entities instead of
 * one strong one is the exact failure the entity spine exists to prevent, so
 * the host does not get a guest page.
 */
export async function getGuests(): Promise<Guest[]> {
  const episodes = await getCollection("episodes");
  const withGuests = episodes
    .filter((e) => !e.data.soloEpisode)
    .sort((a, b) => b.data.episodeNumber - a.data.episodeNumber);

  const bySlug = new Map<string, Guest>();

  for (const entry of withGuests) {
    const d = entry.data;
    const existing = bySlug.get(d.guestSlug);

    if (!existing) {
      bySlug.set(d.guestSlug, {
        slug: d.guestSlug,
        name: d.guest,
        trade: d.trade,
        city: d.city,
        studio: d.studio,
        links: [...d.guestLinks],
        corralArtisanUrl: d.corralArtisanUrl,
        corralTradeUrl: d.corralTradeUrl,
        episodes: [entry],
        thumbnail: d.thumbnail,
        quotes: d.pullQuotes.map((q) => ({
          ...q,
          episodeSlug: d.slug,
          episodeNumber: d.episodeNumber,
        })),
      });
      continue;
    }

    // Second (older) appearance: the newest episode already set the scalars, so
    // only fill the gaps it left, and union the links by URL.
    existing.episodes.push(entry);
    existing.studio ??= d.studio;
    existing.corralArtisanUrl ??= d.corralArtisanUrl;
    existing.corralTradeUrl ??= d.corralTradeUrl;
    for (const link of d.guestLinks) {
      if (!existing.links.some((l) => l.url === link.url)) existing.links.push(link);
    }
    for (const q of d.pullQuotes) {
      existing.quotes.push({ ...q, episodeSlug: d.slug, episodeNumber: d.episodeNumber });
    }
  }

  for (const guest of bySlug.values()) guest.quotes = guest.quotes.slice(0, MAX_QUOTES);
  return [...bySlug.values()];
}

/** Alphabetical by surname-ish: the index groups by trade, so this is a tiebreak. */
export function byName(a: Guest, b: Guest): number {
  return a.name.localeCompare(b.name, "en");
}

/**
 * The definitional lead (plan §3.1) — "Jefferson Mack is a blacksmith and
 * metalsmith in San Francisco…".
 *
 * Built from frontmatter fields ONLY. The temptation here is to write fifteen
 * hand-crafted bios, and the reason not to is that there is no source to write
 * them from: the show notes describe a conversation, not a person. So the
 * sentence below states exactly what the collection knows, and the substantive
 * 40–80 words underneath it on the page are the episode's own hand-written
 * summary, which is sourced.
 */
export function guestLead(guest: Guest): string {
  const article = /^[aeiou]/i.test(guest.trade) ? "an" : "a";
  const trade = guest.trade.toLowerCase();
  const studio = guest.studio ? `, working out of ${guest.studio}` : "";
  return `${guest.name} is ${article} ${trade} in ${guest.city}${studio}.`;
}

/** "1 episode" / "2 episodes" — used in the index eyebrow and the page meta. */
export function appearanceCount(guest: Guest): string {
  const n = guest.episodes.length;
  return `${n} ${n === 1 ? "episode" : "episodes"}`;
}

/** The <meta name="description"> / OG description for a guest page. */
export function guestDescription(guest: Guest): string {
  return `${guestLead(guest)} ${guest.name} on The Trades Show — the craft, the business behind it, and what the trade needs to survive the next generation.`;
}

/* -------------------------------------------------------------------------- */
/* JSON-LD (plan §3.1 + the T3 reference's `/guests/[slug]` row)               */
/* -------------------------------------------------------------------------- */

/**
 * Every URL this page links out to for this person, in the exact form the page
 * links it. Schema that claims a profile the page doesn't show is a claim
 * nobody can check — and the Corral profile is only in here because it was
 * `curl`ed (see the `corralArtisanUrl` note in content.config.ts).
 */
export function guestSameAs(guest: Guest): string[] {
  const urls = guest.links.map((l) => l.url);
  if (guest.corralArtisanUrl) urls.push(guest.corralArtisanUrl);
  return urls;
}

/**
 * `ProfilePage` + `Person`.
 *
 * The Person's `@id` is `guestId(slug)` — THE SAME `@id` the episode pages
 * already emit for this guest. That is the whole point of T4: an assistant that
 * meets "Béatrice Amblard" on the episode page and on the guest page should
 * resolve one person with two pages about her, not two people.
 *
 * The show, the organisation and Briana are `@id` references into the base
 * graph BaseLayout emits on every page; they are never restated here.
 */
export function guestJsonLd(guest: Guest): object {
  const url = guestAbsoluteUrl(guest.slug);
  const { locality, region } = splitCity(guest.city);
  const sameAs = guestSameAs(guest);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#page`,
        url,
        name: `${guest.name} — The Trades Show`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": guestId(guest.slug) },
        mainEntity: { "@id": guestId(guest.slug) },
      },
      {
        "@type": "Person",
        "@id": guestId(guest.slug),
        name: guest.name,
        url,
        mainEntityOfPage: { "@id": `${url}#page` },
        jobTitle: guest.trade,
        homeLocation: { "@type": "Place", name: guest.city },
        address: {
          "@type": "PostalAddress",
          addressLocality: locality,
          ...(region ? { addressRegion: region } : {}),
          addressCountry: "US",
        },
        ...(guest.studio
          ? { worksFor: { "@type": "Organization", name: guest.studio } }
          : {}),
        ...(sameAs.length ? { sameAs } : {}),
        subjectOf: guest.episodes.map((e) => ({
          "@id": `${episodeAbsoluteUrl(e.data.slug)}#episode`,
        })),
      },
    ],
  };
}

/** `/guests` — the same cheap CollectionPage + ItemList the archive gets. */
export function guestsIndexJsonLd(guests: Guest[]): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${GUESTS_PATH}#page`,
        url: `${SITE_URL}${GUESTS_PATH}`,
        name: "Guests — The Trades Show",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": PODCAST_ID },
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}${GUESTS_PATH}#list`,
        numberOfItems: guests.length,
        itemListElement: guests.map((guest, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: guestAbsoluteUrl(guest.slug),
          name: guest.name,
        })),
      },
    ],
  };
}

/** Local copy of episodes.ts's splitter — same rule, kept private to each file. */
function splitCity(city: string): { locality: string; region?: string } {
  const [locality, region] = city.split(",").map((s) => s.trim());
  return { locality, region: region || undefined };
}

/** Re-exported so pages can link an episode without importing two modules. */
export { episodePath };
