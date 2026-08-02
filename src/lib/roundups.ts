/**
 * Roundup plumbing — the two "best of" guides (plan §4.1 / T6).
 *
 * Both guides are the same document shape: a dated `Article` whose `mainEntity`
 * is an `ItemList` of the things it names. That pairing is the point of the
 * finding — a listicle is the most-cited content shape in generative answers,
 * and `ItemList` is what tells a crawler the page is a list of N named,
 * addressable things rather than prose that happens to contain names.
 *
 * Like every other file in `src/lib`, nothing here renders a pixel. It emits
 * the `@graph` the two pages put in `<head>`, and one date constant.
 */

import { SITE_URL, ORG_ID, BRIANA_ID } from "./entity";

/**
 * The last time a roundup was reviewed against reality, in the two forms the
 * page needs: the machine one (`dateModified`) and the visible one.
 *
 * ONE CONSTANT FOR BOTH PAGES, ON PURPOSE. The plan is explicit that these get
 * "refreshed quarterly with real changes (new guests, new numbers — not
 * cosmetic date bumps)", so the date is a claim about editorial work, not a
 * build timestamp. Never wire this to `new Date()`: a page that re-dates itself
 * on every deploy is telling crawlers it was reviewed when it was only rebuilt.
 *
 * NEXT REVIEW: October 2026. Bump this only after re-walking both lists — the
 * podcasts guide's freshness claims (§"Checked before it went on the list")
 * expire fastest, since a show that went quiet is exactly what the reader is
 * trusting this page to have caught.
 */
export const ROUNDUP_UPDATED = "2026-07-31";
export const ROUNDUP_UPDATED_LABEL = "July 2026";

/** First publication. Distinct from `ROUNDUP_UPDATED` once the first refresh lands. */
export const ROUNDUP_PUBLISHED = "2026-07-31";

export const BAY_AREA_ROUNDUP_PATH = "/best-bay-area-artisans";
export const CRAFT_PODCASTS_ROUNDUP_PATH = "/best-craft-podcasts";

interface RoundupGraphOptions {
  /** Site-relative page path, no trailing slash (matches `trailingSlash: 'never'`). */
  path: string;
  headline: string;
  description: string;
  /** Name of the list itself, which is usually not the page headline. */
  listName: string;
  /**
   * Schema.org nodes in the order the page renders them. Each already carries
   * its own `@type`, `name` and `url` — the caller builds them because only the
   * caller knows whether a list item is a `Person` or a `PodcastSeries`.
   */
  items: object[];
}

/**
 * `Article` + `ItemList`.
 *
 * The article's `author`/`publisher` are `@id` references into the base graph
 * BaseLayout already emits on every page; they are never restated here, for the
 * same reason episode pages don't restate the series.
 */
export function roundupGraph({
  path,
  headline,
  description,
  listName,
  items,
}: RoundupGraphOptions): object {
  const url = `${SITE_URL}${path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        url,
        headline,
        description,
        datePublished: ROUNDUP_PUBLISHED,
        dateModified: ROUNDUP_UPDATED,
        author: { "@id": BRIANA_ID },
        publisher: { "@id": ORG_ID },
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: { "@id": `${url}#list` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#list`,
        name: listName,
        url,
        numberOfItems: items.length,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item,
        })),
      },
    ],
  };
}
