import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transform } from "esbuild";

const { code } = await transform(
  await readFile(new URL("../src/pages/api/subscribe.ts", import.meta.url), "utf8"),
  { loader: "ts", format: "esm", define: { "import.meta.env": "{}" } },
);
const { POST } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("every Trades Show signup joins the three newsletter lists without adding the job digest", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.LOOPS_API_KEY;
  const originalList = process.env.LOOPS_LIST_ID;
  process.env.LOOPS_API_KEY = "test-key";
  // A legacy single-list setting must not add the opportunity digest.
  process.env.LOOPS_LIST_ID = "cmt10gzfy7vmx0jy2eml29xyf";
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  };
  try {
    for (const [form, source] of [
      ["instagram", "tts-instagram"],
      ["section", "tts-homepage"],
      ["footer", "tts-footer"],
      [undefined, "tts-site"],
    ]) {
      const response = await POST({ request: new Request("https://thetradesshowpod.com/api/subscribe", {
        method: "POST", body: JSON.stringify({ email: " reader@example.com ", form }),
      }) });
      assert.equal(response.status, 200);
      const call = calls.at(-1);
      assert.equal(call.url, "https://app.loops.so/api/v1/contacts/update");
      assert.equal(call.body.email, "reader@example.com");
      assert.equal(call.body.source, source);
      assert.deepEqual(call.body.mailingLists, {
        cmt10f3th7vnr0j08agzc8b0s: true,
        cmt10giar0nlj0j1s93n21n1f: true,
        cmt10hk4n2uzj0i0e8754b1jy: true,
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.LOOPS_API_KEY;
    else process.env.LOOPS_API_KEY = originalKey;
    if (originalList === undefined) delete process.env.LOOPS_LIST_ID;
    else process.env.LOOPS_LIST_ID = originalList;
  }
});
