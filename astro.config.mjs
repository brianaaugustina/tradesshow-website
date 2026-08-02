// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // `site` is the root of everything absolute the site emits: canonicals,
  // og:image / og:url, and the sitemap. Apex host, no www — www 308-redirects
  // to apex (see RUNBOOK.md).
  site: 'https://thetradesshowpod.com',
  // Pinned so canonicals and sitemap entries agree with what the host serves
  // today (`/`, not `/index/`). Changing this later changes every canonical.
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      // `src/pages/api/subscribe.ts` is a server endpoint (`prerender = false`),
      // not a page — belt-and-braces so it can never surface in the sitemap.
      filter: (page) => !page.includes('/api/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
