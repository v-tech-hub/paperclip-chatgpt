#!/usr/bin/env node
/**
 * Read-only preflight for connecting a hosted Paperclip instance to ChatGPT Web.
 * This is NOT an agent runner, browser automation, or a model gateway.
 */
import { pathToFileURL } from "node:url";

const CHECKS = [
  { id: "health", path: "/api/health" },
  { id: "oauth-discovery", path: "/.well-known/oauth-protected-resource/mcp/paperclip" },
  { id: "assistant-setup", path: "/mcp/setup.md" },
];

export function parsePaperclipOrigin(raw) {
  if (!raw || typeof raw !== "string") throw new Error("Provide a Paperclip origin URL.");
  const u = new URL(raw);
  if (u.username || u.password || u.search || u.hash || (u.pathname !== "/" && u.pathname !== "")) {
    throw new Error("Use an origin only, without credentials, path, query, or fragment.");
  }
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  if (u.protocol !== "https:" && !(u.protocol === "http:" && isLocal)) {
    throw new Error("HTTPS is required except on localhost/loopback.");
  }
  return u.origin;
}

export async function runPreflight(rawOrigin, fetchImpl = fetch) {
  const origin = parsePaperclipOrigin(rawOrigin);
  const checks = [];
  for (const { id, path } of CHECKS) {
    try {
      const response = await fetchImpl(origin + path, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { Accept: id === "assistant-setup" ? "text/markdown" : "application/json" },
      });
      checks.push({ id, status: response.status, ok: response.ok });
    } catch (error) {
      checks.push({ id, status: null, ok: false, error: error?.cause?.code || error?.name || "network-error" });
    }
  }
  return { origin, checks, healthy: checks[0]?.ok === true, mcpDiscoverable: checks[1]?.ok === true };
}

export function formatPreflight(result) {
  const lines = ["Paperclip ChatGPT Web connection preflight", "Instance: " + result.origin];
  for (const c of result.checks) {
    lines.push((c.ok ? "PASS" : "CHECK") + "  " + c.id + ": " + (c.status ?? c.error));
  }
  lines.push(result.healthy ? "Paperclip API is reachable." : "Paperclip API is not reachable yet.");
  lines.push(result.mcpDiscoverable
    ? "MCP OAuth discovery is reachable. Connect it using ChatGPT's supported MCP/plugin settings."
    : "Enable Settings > Experimental > Assistant connections (MCP) after signing in as an admin.");
  lines.push("OAuth remains user-authorized; this script never authenticates, writes tasks, or executes agents.");
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await runPreflight(process.argv[2] || "http://localhost:3100");
    process.stdout.write(formatPreflight(result) + "\n");
    if (!result.healthy) process.exitCode = 1;
  } catch (error) {
    process.stderr.write("Preflight error: " + error.message + "\n");
    process.exitCode = 2;
  }
}
