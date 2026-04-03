export interface Episode {
  number: number;
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

    const episodes: Episode[] = items.slice(0, limit).map((item, index) => {
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
      const description = decodeEntities(
        rawDesc.replace(/<[^>]*>/g, "")
      ).substring(0, 400);

      // Try to get episode artwork, fall back to channel artwork
      const imageMatch = item.match(/<itunes:image\s+href="([^"]+)"/);
      const thumbnail = imageMatch ? imageMatch[1] : "/images/cover-art.jpg";

      const pubDate = getTag("pubDate");

      // Parse episode number from title (e.g., "Ep. 1:" or "Episode 1" or leading number)
      const epNumMatch = title.match(/(?:ep\.?\s*|episode\s*)(\d+)/i) || title.match(/^(\d+)/);
      const number = epNumMatch ? parseInt(epNumMatch[1]) : items.length - index;

      // Link to Spotify show page (individual episode links aren't in RSS)
      const spotifyUrl = "https://open.spotify.com/show/0g5nz0QQY4lNTi7qhfjBoj";

      return { number, title, description, thumbnail, pubDate, spotifyUrl };
    });

    return episodes;
  } catch (error) {
    console.error("Failed to fetch RSS feed:", error);
    return [];
  }
}
