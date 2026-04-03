# Product Requirements Document: The Trades Show Website

**Project:** Migrate thetradesshowpod.com from Squarespace to a custom-built site
**Owner:** Briana Ottoboni
**Date:** March 30, 2026
**Status:** Draft v2
**Design source:** Canva design file (primary), live Squarespace site (secondary reference)
**Canva design:** https://www.canva.com/design/DAG-6D3otDo/TGiuoT4S7Ts7831JAzNrdQ/edit
**Timeline:** ASAP — target launch within 1–2 weeks

---

## 1. Overview

The Trades Show is an interview series where Briana Ottoboni interviews artisans in their workshops. Available as audio on Spotify and Apple Podcasts and as video on YouTube. The current site lives on Squarespace at `thetradesshowpod.com`. This PRD defines every requirement needed to rebuild the site as a custom build using **Astro + Tailwind CSS**, hosted on **Vercel**, with the Canva design file as the primary visual reference.

**Why migrate:** Briana designed the site in Canva first and approximated it in Squarespace, but it feels templated and clunky. The rebuild gives full control over the code, eliminates hosting costs, and matches the original creative vision.

**Brand line:** "Reviving artisan trades in the age of artificial intelligence."

---

## 2. Site Architecture

Single-page site at launch (homepage only, no separate routes). Future phases may add `/season-1`, `/season-2`, etc. for season archive pages.

### Navigation (sticky top bar)
- **Left:** "The Trades Show" in the custom Trades Show Round font (white on dark, dark on light)
- **Right:** Two nav links:
  - "Artisan Jobs Board" — external link to The Corral
  - "Home" — anchor to top of page
- **Mobile:** Hamburger menu or simplified inline links
- **Behavior:** Smooth scroll to anchor sections when applicable

---

## 3. Sections (top to bottom, exact order)

### 3.1 Hero Section
- **Background:** Looping B&W video of artisan workshop footage (muted, autoplay, no controls visible). Briana will cut this from her raw footage.
- **Fallback:** First frame of the video as a static image for slow connections / reduced motion preference
- **Overlay:** Semi-transparent dark gradient so white text stays readable
- **Content (centered, vertically and horizontally):**
  - Headline in Trades Show Round font, large, white: "On location with artisans shaping the future of craftwork"
  - Subtext in Inter Regular, lighter weight: "Each season, a different city. Each episode, inside the workshop of a new story. Watch, listen, and step inside the trades that shape our culture."
  - Two CTA buttons side by side:
    - "WATCH ON YOUTUBE" — white fill, dark text, rounded pill → links to https://www.youtube.com/@tradesshow
    - "LISTEN ON SPOTIFY" — dark fill, white text, thin white border pill → links to https://open.spotify.com/show/0g5nz0QQY4lNTi7qhfjBoj

### 3.2 Manifesto Section
- **Background:** Cream/off-white (`#FAF6F1`)
- **Layout:** Two-column, left-heavy
  - **Left column:** Inter Extrabold, title case: "Everything is getting faster. This show is *not*." — the word "not" in bold italic for emphasis
  - **Right column:** Inter Regular body text describing the show's ethos — about people who make things by hand, work that can't be automated
- **Spacing:** Generous padding top and bottom (80–100px)

### 3.3 Now Playing / Episodes Section
- **Background:** Dark charcoal/near-black (`#2C2C2C`)
- **Layout:**
  - Red uppercase label in Inter Bold/Medium, all caps: "NOW PLAYING" (`#E63946`)
  - City name in Inter Extrabold, title case: "San Francisco"
  - Inter Regular description: Season 2 on location in San Francisco
  - Horizontal divider line
  - **Episode list** — each episode is a row with three columns:
    - **Left:** Episode number (Inter Bold, red) + title in Inter Bold/Medium, all caps
    - **Center:** Episode thumbnail image (square, ~150×150)
    - **Right:** Truncated description in Inter Regular (~150 chars)
  - **Three CTA buttons** at bottom, full-width row:
    - "LISTEN ON APPLE PODCASTS" — dark pill with Apple Podcasts icon
    - "WATCH OR LISTEN ON SPOTIFY" — dark pill with Spotify icon
    - "WATCH ON YOUTUBE" — dark pill with YouTube icon

  **Season handling:** When a new season launches, the "Now Playing" copy updates to the new city and description. Previous season content is replaced on the homepage. Season archive pages may be added as separate routes in the future.

  **Data source:** RSS feed from Spotify for Podcasters (Anchor). Episodes fetched at build time.

### 3.4 Testimonials Section
- **Background:** Cream/off-white
- **Heading:** Inter Extrabold, title case: "What people are saying"
- **Layout:** Four testimonial cards in a horizontal row
  - Each card: light cream/beige background (`#F5EFE6`), subtle rounded corners
  - Red five-star rating icons at the top
  - Quote text in Inter Regular, centered
- **Responsive:** Stack on mobile, horizontal scroll or 2×2 grid on tablet

### 3.5 Ecosystem Section ("More than just a show")
- **Background:** Cream/off-white, continuing from testimonials
- **Content:**
  - Inter Extrabold heading: "More than just a show"
  - Inter Regular body: "*The Trades Show* is one piece of a larger effort to revive, sustain, and grow the artisan trades. Here's what we're building:"
  - **3-card carousel** — horizontal scrollable on mobile, displayed as a row on desktop:
    1. **The Corral** — background image + The Corral logo overlay + short tagline + "ENTER THE CORRAL" CTA button
    2. **The Mag (The Artisan Magazine)** — background image + The Mag logo overlay + short tagline + "VIEW THE MAGAZINE" CTA button
    3. **The Show (The Trades Show)** — background image + The Trades Show logo overlay + short tagline + CTA button
  - Each card: image background, logo centered/overlaid, tagline text below, pill CTA button at bottom
  - Briana to provide: images, logos, and taglines for each card

### 3.6 Meet the Host Section
- **Background:** Cream/off-white
- **Layout:** Card container with beige background (`#F5EFE6`)
  - **Left side:**
    - Inter Bold/Medium, all caps, red: "MEET THE HOST"
    - Inter Extrabold, title case: "Briana Ottoboni"
    - Inter Regular bio paragraph
    - Social icons: Instagram, LinkedIn, personal website (brianaaugustina.com)
  - **Right side:** Portrait photo of Briana (warm tones, professional)

### 3.7 Newsletter Signup Section
- **Background:** Dark charcoal/near-black
- **Layout:** Two-column
  - **Left:** Inter Extrabold heading in white: "From the workshop to your inbox" + Inter Regular body: new episodes, behind-the-scenes stories, one email a month, no noise
  - **Right:** Email input field (white bg, placeholder "Email Address") + "SUBMIT" button (white pill)
- **Integration:** ConvertKit API
- **Behavior:** Client-side form submission to serverless API route (`/api/subscribe`), inline success/error states, no page reload

### 3.8 Social Media / Video Grid Section
- **Background:** White/light
- **Layout:**
  - Row: "FOLLOW ON TIKTOK" button (dark pill) — "The work, up close" in Trades Show Round font — "FOLLOW ON INSTAGRAM" button (outlined pill)
  - Below: Horizontal scrolling row of latest Instagram posts (pulled via Instagram Graph API)
  - Each post: image thumbnail with play button overlay for video content
- **Instagram API:** Requires Instagram Business/Creator account (already set up) + Meta App. Fetches latest ~6 posts at build time.

### 3.9 Footer
- **Background:** Dark olive/charcoal (`#3D3D3D`)
- **Layout:** Multi-column
  - **Column 1:** The Trades Show logo (white, Trades Show Round font + spoon/ladle illustration) + social icons (Instagram, LinkedIn, URL)
  - **Column 2 — "WATCH & LISTEN":** Spotify, YouTube, Apple Podcasts
  - **Column 3 — "CONNECT":** Newsletter, TikTok, Instagram, Substack, YouTube
  - **Column 4 — "CONTACT":** Be a guest, Suggest a guest, Partnerships, Press Inquiries
  - **Column 5 — "ARTISAN TRADES":** The Corral, The Magazine
- **Bottom:** Second email signup form (Email Address + SUBMIT) — same ConvertKit integration
- **Copyright:** © 2026, The Trades Show

---

## 4. Design System

### Color Palette
| Token | Hex (approximate) | Usage |
|-------|-------------------|-------|
| `--black` | `#1A1A1A` | Hero overlay, primary text on light bg |
| `--charcoal` | `#2C2C2C` | Episodes section bg, newsletter bg |
| `--dark-olive` | `#3D3D3D` | Footer bg |
| `--cream` | `#FAF6F1` | Light section backgrounds |
| `--card-beige` | `#F5EFE6` | Testimonial cards, host card bg |
| `--white` | `#FFFFFF` | Text on dark, inputs, CTA fills |
| `--red` | `#E63946` | Accent — labels, stars, episode numbers |
| `--text-light` | `#D4D0CB` | Secondary text on dark backgrounds |

### Typography
| Role | Font | Weight | Style |
|------|------|--------|-------|
| Logo / display | Trades Show Round | Regular (single weight) | Custom handpainted script. Used for "The Trades Show" logo, hero headline, "From the workshop to your inbox", "The work, up close" |
| Headings | Inter | Extrabold (800) | Title case. Section headings like "San Francisco", "What people are saying" |
| Subheaders | Inter | Bold (700) or Medium (500) | ALL CAPS, tracked out. Labels like "NOW PLAYING", "MEET THE HOST" |
| Body | Inter | Regular (400) | Title case / sentence case. All paragraph text and descriptions |
| Buttons | Inter | Bold (700) or Medium (500) | ALL CAPS. Button text |

**Font files:**
- `TradesShowRound-Regular.ttf` — custom, created via Calligraphr. Self-hosted.
- Inter — available on Google Fonts. Load via `@fontsource/inter` or Google Fonts CDN.

### Buttons
Two styles:
1. **Filled pill:** Dark background (`--black`), white uppercase Inter text, fully rounded corners (`border-radius: 9999px`), generous horizontal padding (~32px)
2. **Outlined pill:** Transparent background, thin white or dark border, uppercase Inter text, same rounded shape

### Spacing & Layout
- Max content width: ~1200px centered
- Generous vertical padding between sections (80–120px)
- Full-bleed dark sections edge to edge
- The site breathes — lots of whitespace on the cream sections

### Animations
- **Smooth scroll:** For any nav anchor links
- **Fade-in on scroll:** Subtle fade + slight upward slide as sections enter the viewport (use `IntersectionObserver`)
- Keep it tasteful — no bounces, no aggressive parallax

---

## 5. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Astro (SSG) | Static site generation, builds fast |
| Styling | Tailwind CSS v4 | Utility-first, matches the design tokens |
| Hosting | Vercel | Free tier, auto deploys from GitHub |
| Email / newsletter | ConvertKit | Already has an account set up |
| Contact form delivery | ConvertKit tag + email notification | Submissions tagged in CK + email to briana@thetradesshowpod.com |
| Episode data | RSS feed (Spotify for Podcasters / Anchor) | Fetched at Astro build time |
| Instagram feed | Instagram Graph API (Business account) | Latest posts fetched at build time |
| Fonts | Self-hosted (Trades Show Round) + Google Fonts (Inter) | |
| Icons | Lucide or inline SVGs | Social icons, star ratings |
| Analytics | Vercel Analytics | Built in, privacy-friendly, free tier |
| Video | Self-hosted MP4 or optimized WebM | B&W hero video loop |

### Astro Project Structure
```
/
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── Hero.astro              (B&W video bg + overlay + CTAs)
│   │   ├── Manifesto.astro
│   │   ├── NowPlaying.astro        (season header + episode list)
│   │   ├── EpisodeRow.astro        (single episode row component)
│   │   ├── Testimonials.astro
│   │   ├── TestimonialCard.astro
│   │   ├── Ecosystem.astro         (3-card carousel)
│   │   ├── EcosystemCard.astro     (individual venture card)
│   │   ├── MeetTheHost.astro
│   │   ├── NewsletterSignup.astro  (reusable — used in section + footer)
│   │   ├── SocialGrid.astro        (Instagram API feed)
│   │   ├── ContactForm.astro       (modal or inline form)
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── api/
│   │       ├── subscribe.ts        (ConvertKit newsletter signup)
│   │       └── contact.ts          (Contact form → ConvertKit tag + email)
│   ├── lib/
│   │   ├── rss.ts                  (RSS feed fetcher/parser)
│   │   ├── instagram.ts            (Instagram Graph API helper)
│   │   └── convertkit.ts           (ConvertKit API helper)
│   ├── data/
│   │   ├── testimonials.json       (4 testimonial quotes)
│   │   └── ecosystem.json          (3 venture cards: name, tagline, image, CTA, URL)
│   └── styles/
│       └── global.css              (Tailwind directives, @font-face for Trades Show Round)
├── public/
│   ├── fonts/
│   │   └── TradesShowRound-Regular.ttf
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-white.svg
│   │   ├── briana-headshot.jpg
│   │   └── ecosystem/             (venture card images)
│   └── video/
│       └── hero-loop.mp4          (B&W workshop footage, optimized)
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
└── vercel.json
```

---

## 6. RSS Feed Integration

Episodes fetched at build time from Spotify for Podcasters (Anchor) RSS feed.

**Required per episode:**
- Episode number (parsed from title string)
- Title (full)
- Thumbnail/artwork URL (`<itunes:image>` or `<media:thumbnail>`)
- Description (truncated to ~150 chars for list view)
- Published date
- Direct links: Spotify, Apple Podcasts, YouTube (may need manual mapping in a supplementary data file if not in RSS)

**RSS feed URL:** Briana to provide the Anchor/Spotify for Podcasters RSS URL (found in Spotify for Podcasters dashboard under Settings → Distribution → RSS feed).

**Build behavior:** Astro fetches + parses RSS at build time. Vercel deploy hook or cron triggers daily rebuilds so new episodes appear within 24 hours of publishing.

---

## 7. Newsletter + Contact Form Integration

### Newsletter (ConvertKit)
- Two signup forms on page (Section 3.7 + footer)
- Both submit to `/api/subscribe` serverless function
- API route calls ConvertKit API to add subscriber to a specific form/sequence
- Inline success ("You're in!") and error states
- No page reload

### Contact Form
- **Trigger:** Footer links "Be a guest", "Suggest a guest", "Partnerships", "Press Inquiries" all open the same contact form
- **Implementation:** Modal overlay or dedicated inline section with smooth scroll
- **Fields:**
  - Name (text, required)
  - Email (email, required)
  - Inquiry Type (dropdown: Guest Application, Guest Suggestion, Partnership, Press, required)
  - Message (textarea, required)
- **Submission:** `/api/contact` serverless function → adds contact to ConvertKit with a tag matching the inquiry type + sends email notification to briana@thetradesshowpod.com
- **Success state:** Inline confirmation message

---

## 8. Instagram Graph API Integration

Pull latest posts from Briana's Instagram Business/Creator account for the "The work, up close" section.

**Requirements:**
- Meta Developer App created and configured
- Instagram Graph API access token (long-lived, auto-refreshed)
- Fetch latest 6 posts at build time (image URL, permalink, media type, caption)
- Display as thumbnails with play button overlay for video content
- Link each thumbnail to the Instagram post

**Fallback:** If API is unavailable or rate-limited, display static placeholder images.

**Setup needed from Briana:**
- Meta App ID and App Secret
- Instagram Business account ID
- Generated long-lived access token

---

## 9. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (1200px+) | Full layout as described — multi-column sections, 4 testimonial cards, 3 ecosystem cards, video hero |
| Tablet (768–1199px) | 2-column where applicable; testimonials as 2×2 grid; ecosystem cards horizontal scroll; episode rows compress |
| Mobile (< 768px) | Single column; hero video still plays (reduced file size variant); testimonials stack; ecosystem carousel swipeable; footer columns stack; episode rows become stacked cards |

Navigation on mobile: hamburger menu with slide-out panel.
Video hero: serve a smaller/lower-bitrate version on mobile via `<source>` media queries.

---

## 10. SEO & Performance

### Meta & Structured Data
- **Title:** "The Trades Show — On location with artisans shaping the future of craftwork"
- **Description:** "Each season, a different city. Each episode, inside the workshop of a new story. Watch, listen, and step inside the trades that shape our culture."
- **Open Graph / Twitter Card:** Show artwork as og:image
- **Structured data:** PodcastSeries + PodcastEpisode schema markup (JSON-LD)

### Target Keywords
- artisan trades
- artisan podcast
- craftworkers
- craft podcast
- the trades show

### Performance
- **Lighthouse target:** 95+ across Performance, Accessibility, Best Practices, SEO
- **Image optimization:** Astro `<Image>` component, WebP/AVIF, lazy loading
- **Font loading:** `font-display: swap`, preload Trades Show Round and Inter Extrabold
- **Video optimization:** MP4 + WebM, compressed, poster frame for initial load, `preload="metadata"`

---

## 11. External Links Map

| Link text | Destination |
|-----------|-------------|
| Artisan Jobs Board (nav) | The Corral (external URL — Briana to confirm) |
| Watch on YouTube | https://www.youtube.com/@tradesshow |
| Listen on Spotify | https://open.spotify.com/show/0g5nz0QQY4lNTi7qhfjBoj |
| Listen on Apple Podcasts | Briana to provide Apple Podcasts URL |
| Follow on TikTok | Briana to provide TikTok profile URL |
| Follow on Instagram | https://www.instagram.com/brianaaugustina |
| LinkedIn (host bio) | https://www.linkedin.com/in/brianaottoboni/ |
| Personal site (host bio) | https://www.brianaaugustina.com/ |
| Newsletter (Substack) | Briana to provide Substack URL |
| Be a guest | Opens contact form modal (inquiry type: Guest Application) |
| Suggest a guest | Opens contact form modal (inquiry type: Guest Suggestion) |
| Partnerships | Opens contact form modal (inquiry type: Partnership) |
| Press Inquiries | Opens contact form modal (inquiry type: Press) |
| The Corral | Briana to provide URL |
| The Artisan Mag | Briana to provide URL |

---

## 12. Assets Needed from Briana

### Already Provided
- [x] `TradesShowRound-Regular.ttf` — custom logo/display font
- [x] Spotify URL
- [x] YouTube URL
- [x] Instagram URL
- [x] LinkedIn URL
- [x] Personal site URL

### Still Needed Before Development
1. **Hero video** — B&W workshop footage loop (Briana cutting from raw footage). Target: 10–20 seconds, 1080p or 720p, <5MB compressed.
2. **Logo files** — The Trades Show logo in SVG (or high-res PNG), dark and white versions. Includes the spoon/ladle illustration.
3. **Headshot** — Briana's portrait photo, high-res.
4. **Ecosystem card assets** — For each of the 3 cards (The Corral, The Mag, The Show): background image, logo, tagline copy, CTA text, destination URL.
5. **Testimonial quotes** — Exact text and attribution for all 4 testimonials.
6. **RSS feed URL** — From Spotify for Podcasters dashboard (Settings → Distribution → RSS feed).
7. **ConvertKit API key** — API key + form ID for newsletter signups.
8. **Meta/Instagram API credentials** — Meta App ID, App Secret, Instagram Business account ID, long-lived access token.
9. **Remaining URLs** — Apple Podcasts, TikTok, Substack, The Corral, The Artisan Mag.
10. **Contact email confirmed** — briana@thetradesshowpod.com (need email actually set up and receiving mail).
11. **Domain/DNS access** — For pointing thetradesshowpod.com to Vercel.

---

## 13. Development Phases

### Phase 1: Scaffold & Static Layout (Days 1–4)
- Initialize Astro project with Tailwind CSS
- Configure Trades Show Round + Inter fonts
- Build all section components with hardcoded content
- B&W video hero with fallback
- Responsive across all breakpoints
- Smooth scroll + fade-in animations
- Deploy to Vercel (staging URL)

### Phase 2: Dynamic Content & Integrations (Days 5–8)
- RSS feed parser for episodes
- ConvertKit API integration (newsletter signup + contact form)
- Instagram Graph API for social grid
- Contact form modal with ConvertKit tagging + email notification
- Ecosystem 3-card carousel with real content

### Phase 3: Polish & Launch (Days 9–12)
- SEO meta tags, Open Graph, structured data (JSON-LD)
- Image + video optimization
- Lighthouse audit — target 95+ all categories
- Accessibility pass (ARIA labels, keyboard nav, reduced motion)
- Configure custom domain (thetradesshowpod.com → Vercel)
- Test all outbound links
- Final QA on mobile, tablet, desktop
- Launch

---

## 14. Open Questions (Reduced)

1. **Apple Podcasts URL** — What's the direct link to The Trades Show on Apple Podcasts?
2. **TikTok URL** — What's your TikTok profile URL?
3. **Substack URL** — What's the newsletter Substack URL?
4. **The Corral + Artisan Mag URLs** — What are the exact URLs for these ventures?
5. **Ecosystem card copy** — What are the taglines for each venture card?
6. **Hero video timing** — When will the B&W footage loop be ready?
7. **Contact email setup** — Is briana@thetradesshowpod.com already configured to receive mail, or does it need to be set up (e.g., via Google Workspace, Zoho, etc.)?
