/** Character budget for a card description. Was a flat `.substring(0, 400)`. */
export const DESCRIPTION_LIMIT = 400;

/**
 * Truncate at a sentence boundary, not mid-word (T7).
 *
 * A flat substring produced live copy like "…gathering leaves and gra". Cut at
 * the last `.`/`!`/`?` inside the budget; if that would throw away more than
 * half the allowance (a feed item with one very long opening sentence), fall
 * back to the last whole word plus an ellipsis.
 *
 * MIRRORED in NowPlaying.astro's `<script>` — the live RSS refresh re-derives
 * descriptions in the browser. Change both or the text visibly shifts a second
 * after load.
 */
export function truncateAtSentence(text: string, limit = DESCRIPTION_LIMIT): string {
  const clean = text.trim();
  if (clean.length <= limit) return clean;

  const head = clean.slice(0, limit);
  const lastSentenceEnd = Math.max(
    head.lastIndexOf("."),
    head.lastIndexOf("!"),
    head.lastIndexOf("?")
  );
  if (lastSentenceEnd >= limit / 2) {
    return head.slice(0, lastSentenceEnd + 1).trim();
  }

  const lastSpace = head.lastIndexOf(" ");
  const words = (lastSpace > 0 ? head.slice(0, lastSpace) : head)
    .replace(/[\s,;:—–-]+$/, "")
    .trim();
  // Don't stack an ellipsis on a full stop ("Ok.…") when the only sentence
  // break sat right at the start of a long unpunctuated blurb.
  return /[.!?]$/.test(words) ? words : words + "…";
}

export interface Episode {
  number: number | null;
  title: string;
  description: string;
  thumbnail: string;
  pubDate: string;
  spotifyUrl: string;
}

export async function fetchEpisodes(limit = 5): Promise<Episode[]> {
  const RSS_URL = "https://anchor.fm/s/1058aec28/podcast/rss";

  try {
    const res = await fetch(RSS_URL);
    const xml = await res.text();

    const items = xml.match(/<item[\s\S]*?<\/item>/g) || [];

    const episodes: Episode[] = items.map((item) => {
      const getTag = (tag: string) => {
        const match = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
        return match ? match[1].trim() : "";
      };

      const rawTitle = getTag("title");
      const rawDesc = getTag("description");

      // Decode HTML entities
      const decodeEntities = (str: string) =>
        str
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&apos;/g, "'");

      const title = decodeEntities(rawTitle);
      const description = truncateAtSentence(
        decodeEntities(rawDesc.replace(/<[^>]*>/g, ""))
      );

      // Try to get episode artwork, fall back to channel artwork
      const imageMatch = item.match(/<itunes:image\s+href="([^"]+)"/);
      const thumbnail = imageMatch ? imageMatch[1] : "/images/cover-art.jpg";

      const pubDate = getTag("pubDate");

      // Parse episode number from title (e.g., "Ep. 1:" or "Episode 1" or leading number)
      const epNumMatch = title.match(/(?:ep\.?\s*|episode\s*)(\d+)/i) || title.match(/^(\d+)/);
      const number = epNumMatch ? parseInt(epNumMatch[1]) : null;

      // Link to Spotify show page (individual episode links aren't in RSS)
      const spotifyUrl = "https://open.spotify.com/show/0g5nz0QQY4lNTi7qhfjBoj";

      return { number, title, description, thumbnail, pubDate, spotifyUrl };
    })
      // Drop trailers / promo items that have no episode number
      .filter((ep) => !(ep.number === null && /trailer/i.test(ep.title)));

    // Defensive: infer a missing number on the newest item(s) from the next
    // numbered episode below it (feed is newest-first).
    for (let i = episodes.length - 1, last: number | null = null; i >= 0; i--) {
      if (episodes[i].number != null) last = episodes[i].number;
      else if (last != null) episodes[i].number = ++last;
    }

    return episodes.slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch RSS feed:", error);
    return [];
  }
}
