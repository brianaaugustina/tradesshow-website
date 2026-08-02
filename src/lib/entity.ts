/**
 * The entity spine (T3) — the one place the show's identity is spelled out for
 * machines. Everything here is invisible: it renders into a single
 * `<script type="application/ld+json">` in BaseLayout's `<head>` and changes no
 * pixel on any page.
 *
 * ENTITY CONSISTENCY IS THE WHOLE POINT. The `Person` node below must stay
 * string-for-string identical to the one The Corral ships in
 * `the-corral-v2/src/lib/site-jsonld.ts` (`FOUNDER_SAME_AS` + `name`). A
 * near-miss URL does not reinforce one person, it invents a second, weaker one.
 * If you change a string here, change it there in the same commit.
 */

export const SITE_URL = "https://thetradesshowpod.com";

/**
 * The one canonical description of the SHOW — plan §1.3/T3's "the existing meta
 * description", i.e. the homepage's. It is a constant, not a parameter, and
 * that is load-bearing: the base graph's `@id`s (`#podcast`, `#organization`)
 * are site-wide singletons, so whatever string reaches them must be the same on
 * every route. Threading each page's own `description` prop in here instead
 * would make `/episodes/jefferson-mack-blacksmith` declare that the SHOW is "a
 * self-taught architectural blacksmith in San Francisco…" — seven pages
 * describing one `@id` seven different ways, which is precisely the entity
 * ambiguity this file exists to remove.
 *
 * BaseLayout's `description` default is this same constant (imported, not
 * retyped) so the visible `<meta name="description">` on the homepage and the
 * invisible schema can never drift apart.
 *
 * Per-page descriptions still belong in `<meta>`/OG and in the page's OWN
 * schema nodes (`PodcastEpisode.description`, `CollectionPage.description`) —
 * those have their own `@id`s and are supposed to differ.
 */
export const SITE_DESCRIPTION =
  "Each season, a different city. Each episode, inside the workshop of a new story. Watch, listen, and step inside the trades that shape our culture.";

/** Stable @ids: site-wide entities are not pages, so they live on fragments. */
export const PODCAST_ID = `${SITE_URL}/#podcast`;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/** Referenced from every future episode/guest page as the show's creator. */
export const BRIANA_ID = `${SITE_URL}/#briana`;

/** The Anchor feed the homepage already reads at build time and on load. */
export const PODCAST_FEED_URL = "https://anchor.fm/s/1058aec28/podcast/rss";

/**
 * Show-owned surfaces. Every entry is a URL this site already links to
 * somewhere in its own footer/nav, in the exact form it links to it — schema
 * that disagrees with the visible link about a profile URL is worse than none.
 *
 * Instagram is the show handle (double-s "tradesshow"), matching what The
 * Corral lists in its Organization `sameAs`.
 */
export const SHOW_SAME_AS = [
  "https://open.spotify.com/show/0g5nz0QQY4lNTi7qhfjBoj",
  "https://www.youtube.com/@tradesshow",
  "https://podcasts.apple.com/us/podcast/the-trades-show/id1821328343",
  "https://tiktok.com/@tradesshow",
  "https://www.instagram.com/tradesshow",
  "https://revivethetrades.substack.com",
];

/**
 * Briana's own accounts, distinct from the show's — copied verbatim from The
 * Corral's `FOUNDER_SAME_AS`, same order, same trailing slashes.
 *
 * NOTE (open, do not "fix" here): The Corral's `about/FounderNote.tsx` links
 * `/in/briana-ottoboni` while both live sites and both schema blocks use
 * `/in/brianaottoboni/`. The two must be reconciled by hand on the Corral side;
 * this file stays consistent with the Corral's shipped schema either way.
 */
export const BRIANA_SAME_AS = [
  "https://www.linkedin.com/in/brianaottoboni/",
  "https://www.instagram.com/brianaaugustina",
];

/**
 * The `Person` node. Deliberately carries no `description`/`jobTitle`: the one
 * canonical bio string is still an open decision (plan §"Decisions needed from
 * Briana" #5) and The Corral's Person ships without one, so shipping a
 * hand-invented bio here would immediately put the two sites out of sync.
 *
 * TODO(BRIANA): once the canonical one-sentence bio is signed off, add it as
 * `description` HERE and in the-corral-v2/src/lib/site-jsonld.ts in the same
 * change.
 */
function brianaNode() {
  return {
    "@type": "Person",
    "@id": BRIANA_ID,
    name: "Briana Ottoboni",
    url: `${SITE_URL}/`,
    sameAs: BRIANA_SAME_AS,
  };
}

/**
 * The base `@graph` every page inherits: what the show is (PodcastSeries), who
 * publishes it (Organization), what this site is (WebSite), and who is behind
 * it (Person). Episode pages append their own nodes rather than restating these
 * — they reference the `@id`s above.
 */
export function siteEntityGraph(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "PodcastSeries",
        "@id": PODCAST_ID,
        name: "The Trades Show",
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        image: `${SITE_URL}/images/cover-art.jpg`,
        webFeed: PODCAST_FEED_URL,
        author: { "@id": BRIANA_ID },
        publisher: { "@id": ORG_ID },
        sameAs: SHOW_SAME_AS,
      },
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "The Trades Show",
        url: `${SITE_URL}/`,
        // The stacked black wordmark, not the white one: Google renders a logo
        // on a light surface, where white-on-white is an empty box.
        logo: `${SITE_URL}/images/logo-stacked-black.svg`,
        description: SITE_DESCRIPTION,
        email: "briana@thetradesshowpod.com",
        founder: { "@id": BRIANA_ID },
        sameAs: SHOW_SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "The Trades Show",
        url: `${SITE_URL}/`,
        publisher: { "@id": ORG_ID },
      },
      brianaNode(),
    ],
  };
}

/**
 * Serialize for a `<script type="application/ld+json">`. Escaping `<` is what
 * stops any string (an episode title, a guest bio) from closing the tag early.
 */
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
