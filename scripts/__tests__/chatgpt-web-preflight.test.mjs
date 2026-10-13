import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePaperclipOrigin, runPreflight, formatPreflight } from "../chatgpt-web-preflight.mjs";

test("accepts loopback HTTP and HTTPS origins", () => {
  assert.equal(parsePaperclipOrigin("http://localhost:3100/"), "http://localhost:3100");
  assert.equal(parsePaperclipOrigin("https://paperclip.example.org"), "https://paperclip.example.org");
});

test("rejects credentials, arbitrary HTTP, and paths", () => {
  for (const value of [
    "http://paperclip.example.org", "https://u:p@paperclip.example.org",
    "https://paperclip.example.org/mcp/paperclip", "https://paperclip.example.org/?token=bad",
  ]) {
    assert.throws(() => parsePaperclipOrigin(value));
  }
});

test("detects usable health and MCP discovery without authorization", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push([url, options.method, options.redirect]);
    return { status: 200, ok: true };
  };
  const result = await runPreflight("http://localhost:3100", fakeFetch);
  assert.equal(result.healthy, true);
  assert.equal(result.mcpDiscoverable, true);
  assert.equal(calls.length, 3);
  assert.ok(calls[1][0].endsWith("/.well-known/oauth-protected-resource/mcp/paperclip"));
  assert.equal(calls[0][1], "GET");
  assert.equal(calls[0][2], "manual");
});

test("reports a disabled MCP endpoint without claiming working integration", async () => {
  let count = 0;
  const result = await runPreflight("https://example.org", async () => {
    count++;
    return { status: count === 1 ? 200 : 404, ok: count === 1 };
  });
  assert.equal(result.healthy, true);
  assert.equal(result.mcpDiscoverable, false);
  assert.match(formatPreflight(result), /Enable Settings/);
});

test("reports unavailable instances as offline", async () => {
  const result = await runPreflight("https://example.org", async () => {
    throw new TypeError("fetch failed");
  });
  assert.equal(result.healthy, false);
  assert.equal(result.checks.length, 3);
  assert.match(formatPreflight(result), /not reachable/);
});
