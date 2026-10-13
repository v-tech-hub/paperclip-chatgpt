# 2026-10-13 — Paperclip + ChatGPT Web Native MVP

## Goal

Keep upstream Paperclip as Core and let a **live ChatGPT Web conversation** act as the human-authorized operator through Paperclip's first-party public MCP tools. The system must not use Claude/Codex CLI, OpenAI API, ChatGPT Work or web-session scraping as its thinking runtime.

## Scope

- Upstream-linked GitHub fork.
- Existing company/project/task/approval UI and state.
- Native `/mcp/paperclip` + Paperclip OAuth, turned on only after admin approval.
- Operator instructions for multiple logical roles using one ChatGPT session.
- Read-only preflight with unit tests to help distinguish healthy API from enabled MCP discovery.
- Manual, authenticated ChatGPT connection and smoke test.

## Out of scope

- New AI inference endpoint.
- Named agent runtime impersonation via human OAuth.
- Autonomous heartbeats invoking this chat.
- Ten parallel independent ChatGPT Web sessions.
- Public deployment without access controls and consent.

## Acceptance gates

- [x] Create upstream-linked fork and working development branch.
- [x] Confirm first-party public MCP/OAuth exists in upstream.
- [x] Add operator/runbook documentation and read-only health diagnostics.
- [x] Local `pnpm install`, build dashboard, start server and confirm healthy `/api/health` (verified on macOS Dev Host; Ubuntu host unavailable).
- [ ] Admin enables Assistant connections in authenticated instance.
- [ ] HTTPS deployment with appropriate proxy/auth/rate limits for browser MCP.
- [ ] Explicit user OAuth grants ChatGPT connection.
- [ ] ChatGPT Web can read company, list tasks, create a small test task and read it again in a new conversation.
- [ ] Separate, authorized developer tools update a real code task, with status and test report in Paperclip.

## Design invariants

Use existing first-party OAuth/RBAC for the user connection; do not add a second MCP auth framework. Never invent asynchronous ChatGPT Web capabilities or claim the user subscription is unlimited. Retain `upstream` remote and minimize upstream code changes.