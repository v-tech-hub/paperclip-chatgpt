# ChatGPT Web operator (MVP)

> Fork-specific setup. The **brain** is the user's live conversation at chatgpt.com.
> This is not ChatGPT Work, Codex/Claude CLI, OpenAI API, a browser bot, or a headless agent runner.

## Design decision

Use the **existing** Paperclip Core, browser dashboard, database, governance, and first-party public MCP endpoint. No duplicate bridge and no upstream server changes are needed for the initial connection.

- Paperclip persists companies, projects, tasks, agents, approvals, and history.
- ChatGPT Web reasons and operates tools **when an interactive chat is active**.
- The first-party MCP connection authorizes the *human operator* against one company, using its existing OAuth consent and RBAC. It **does not** turn the conversation into a named Paperclip agent heartbeat.
- Paperclip's configured background agents, if any, have their own model/runner/credentials and are **not** this ChatGPT Web conversation. Leave these disabled/unconfigured for this AI-free-runner MVP.
- No claim of ten autonomous ChatGPT Web sessions, unlimited messages, or unattended 24/7 thinking.

## Run locally

See `AGENTS.md` for current upstream development steps. With Node.js and pnpm installed:

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3100` and finish the initial onboarding with **real authenticated human accounts**. PGlite is available locally if `DATABASE_URL` is unset. For a public browser connector, deploy behind authenticated HTTPS with a properly configured public origin; localhost is not remotely accessible from ChatGPT.

Read-only diagnostics (safe on local or HTTPS deployment):

```sh
node scripts/chatgpt-web-preflight.mjs http://localhost:3100
node --test scripts/__tests__/chatgpt-web-preflight.test.mjs
```

## Enable the native MCP endpoint

1. Run migrations through the normal Paperclip workflow; do not skip migrations.
2. In Paperclip, go to **Settings → Experimental → Assistant connections (MCP)** and enable the setting.
3. For HTTPS deployment set `PAPERCLIP_PUBLIC_URL=https://YOUR-HOST` (origin only); configure reverse proxy trust, TLS, rate limits, and real user login.
4. Visit **Connectors → Assistant Connection (MCP) → Set up** for the instance-specific invitation. External MCP endpoint: `https://YOUR-HOST/mcp/paperclip`.
5. In ChatGPT Web, add this instance as a custom MCP connector/plugin if supported by the account and UI; complete the Paperclip OAuth flow, select the intended company and grant only the required permissions. Connection/install always requires the user's explicit approval.
6. Ask ChatGPT to invoke `paperclip_connection` and confirm the selected company **before writes**.
7. Read agents, projects, and tasks; create a small reversible task and verify it is visible on the Paperclip dashboard.
8. In a fresh conversation, reconnect and read the same task. This validates durable state rather than reliance on chat context.

MCP server connection is **not** the same as granting Git/Dev Host permissions. Use separate, explicit tool access for code execution, tests and deployment.

## Working model

1. Owner asks ChatGPT to work on a project.
2. ChatGPT reads the correct company, project and task via Paperclip MCP.
3. ChatGPT plans and selects a logical role (CEO/Architect/Developer/QA) according to [operator instructions](CHATGPT-WEB-OPERATOR.md).
4. ChatGPT uses its enabled developer tools in the active chat.
5. ChatGPT writes a work note, evidence/test results, task update, and handoff to Paperclip through authorized MCP operations.
6. User sees the work and approvals in Paperclip, and may resume later in another chat.

## Safety/limits

- The public MCP OAuth session acts under a **human user identity**, not under a forged named-agent identity.
- Do not bypass ChatGPT product limits or rely on browser automation of chatgpt.com.
- An unanswered heartbeat cannot wake or continue this ChatGPT Web conversation.
- Do not place API credentials or OAuth tokens in project instructions, URLs, source control, or chat.
- Require explicit approval for deployments, destructive repository/database changes, permissions/credentials, external publishing and any charge-incurring action.
- For uncertain MCP mutation results reuse the same documented request ID / inspect state; never blindly retry using a new ID.
- Follow upstream documentation at `doc/public-mcp.md`, including authentication, expected authorization and HTTPS requirements.
- A production deployment and an actual ChatGPT MCP OAuth connection remain separate acceptance gates. A source checkout alone does not satisfy them.

## Related

- [ChatGPT operator instructions](CHATGPT-WEB-OPERATOR.md)
- [Acceptance plan](plans/2026-10-13-chatgpt-web-native-mvp.md)
- [Upstream public MCP docs](public-mcp.md)
