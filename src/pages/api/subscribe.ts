import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Newsletter signup → Loops (loops.so, v1 API).
 *
 * Replaces the former ConvertKit/Kit v3 integration. Env-gated on
 * LOOPS_API_KEY — with no key set the endpoint reports a clean failure rather
 * than silently dropping the address.
 *
 * `contacts/update` is an upsert: it creates the contact when none matches, so
 * a repeat signup is a no-op instead of a duplicate error to special-case.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    // Honeypot: the form renders a hidden "company_website" input that stays
    // empty for humans. A filled trap is a bot — drop it but report success so
    // the bot gets no signal. Kit's double opt-in used to catch these; Loops
    // is single opt-in, so the trap has to do that job now.
    if (typeof body?.company_website === "string" && body.company_website.trim() !== "") {
      return json({ success: true }, 200);
    }

    if (!email || !email.includes("@")) {
      return json({ error: "A valid email is required" }, 400);
    }

    // Each form placement becomes its own Loops `source`, so segments can be
    // built per capture point without any tag/id mapping to maintain.
    const FORM_SOURCES: Record<string, string> = {
      section: "tts-homepage",
      footer: "tts-footer",
    };
    const source = FORM_SOURCES[String(body?.form ?? "")] ?? "tts-site";

    // Read process.env first. Astro/Vite can inline `import.meta.env.X` at build
    // time, which yields undefined for a var that only exists in the hosting
    // runtime — the likely reason the old ConvertKit code carried a hardcoded
    // key as a fallback. process.env is the runtime value on Vercel; the
    // import.meta.env fallback keeps `astro dev` working from .env.local.
    const apiKey = process.env.LOOPS_API_KEY || import.meta.env.LOOPS_API_KEY;
    if (!apiKey) {
      console.error("[loops] LOOPS_API_KEY is not set — signup dropped:", email);
      return json({ error: "Subscription failed" }, 500);
    }

    const listId = process.env.LOOPS_LIST_ID || import.meta.env.LOOPS_LIST_ID;
    const res = await fetch("https://app.loops.so/api/v1/contacts/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        source,
        subscribed: true,
        ...(listId ? { mailingLists: { [listId]: true } } : {}),
      }),
    });

    if (!res.ok) {
      console.error("[loops] subscribe failed:", res.status, await res.text().catch(() => ""));
      return json({ error: "Subscription failed" }, 500);
    }

    return json({ success: true }, 200);
  } catch (error) {
    console.error("Subscribe error:", error);
    return json({ error: "Internal server error" }, 500);
  }
};

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
