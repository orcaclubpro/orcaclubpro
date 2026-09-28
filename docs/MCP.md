# MCP Quick Start

Connect Claude to ORCACLUB so it can draft cycle recaps, log work, build packages and SOWs,
and manage milestones. Runs on your Claude subscription — no API key, no per-use billing.

Claude drafts. You review and send. No tool here touches Stripe, creates an order, or emails
a client.

---

## 1. Get your API key

There is **no admin UI for this.** Payload declares `enableAPIKey` and `apiKey` with
`admin: { components: { Field: false } }`, so neither field renders in the admin panel — there
is no checkbox to tick. Use the script:

```bash
node scripts/mcp-api-key.mjs --email you@orcaclub.pro --show          # check current state
node scripts/mcp-api-key.mjs --email you@orcaclub.pro --set --yes     # generate one
```

`--set` prints the key once. Copy it then.

**Check the secret fingerprint the script prints.** `apiKeyIndex` is
`HMAC-SHA1(PAYLOAD_SECRET, key)`, and API-key auth looks the user up by that index — so a key
provisioned under a different `PAYLOAD_SECRET` than the environment reading it fails with a
bare 401 and nothing in the log. Compare the fingerprint against the `PAYLOAD_SECRET` in your
deployment's env vars before trusting the key. Provision with the same secret production runs.

Then enable the feature — it ships **off**:

```ts
// src/lib/payload/payload.config.ts, Users.auth
useAPIKey: true,
```

Deploy that. Order matters: provision the key first, enable second. Turning `useAPIKey` on
while `users.apiKey` holds anything that is not a valid Payload-encrypted string makes the
field's `afterRead` hook throw `ERR_CRYPTO_INVALID_IV` on **every read of that user**, which
breaks admin login and passkey verification. If you hit that, recover with:

```bash
node scripts/mcp-api-key.mjs --email you@orcaclub.pro --clear --yes
```

Treat the key like a password — it carries your full staff role. Revoke with `--clear`.

---

## 2. Add it to Claude Code

**Run this from the orcaclubpro directory.** `claude mcp add` scopes the server to whatever
directory you are standing in, so running it elsewhere registers it to the wrong project and
it will not load here.

```bash
cd ~/DEV/git/orcaclubpro

claude mcp add --transport http orcaclub http://localhost:3000/api/mcp \
  --header "Authorization: users API-Key YOUR_KEY_HERE"
```

Keep `users` exactly as written — it is the Payload collection slug, not a placeholder. Match
the port to whatever the dev server actually used.

Already added it to the wrong project? Remove it from there and re-add from the right place:

```bash
cd ~/DEV/git/<wrong-project> && claude mcp remove orcaclub
cd ~/DEV/git/orcaclubpro    && claude mcp add --transport http orcaclub \
  http://localhost:3000/api/mcp --header "Authorization: users API-Key YOUR_KEY_HERE"
```

---

## 3. Verify

Restart Claude Code, then:

```
/mcp
```

You should see `orcaclub` connected with 16 tools. Then try the real thing:

```
draft the September recap for <client name>
```

Claude reads the cycle's time entries, writes the narrative, and saves a draft. Open the
recap composer in the dashboard — it will be pre-filled. Edit and send from there as usual.

---

## Troubleshooting

**`HTTP 401 — Unauthorized`**

Confirm the key works at all, independently of Claude:

```bash
curl -H "Authorization: users API-Key YOUR_KEY_HERE" \
  http://localhost:3000/api/users/me
```

- `{"user":null,...}` → Payload is rejecting the key. Check state and secret alignment:
  `node scripts/mcp-api-key.mjs --email you@orcaclub.pro --show`. If `enableAPIKey` is not
  `true`, or the printed secret fingerprint differs from the env var the server is running
  with, re-provision with `--set --yes` under the right `PAYLOAD_SECRET`.
- Returns your user → the key is good, so the problem is in the Claude config. Check the
  header is `users API-Key <key>` (not `Bearer`), and that the server is registered to this
  project (`claude mcp list` from the orcaclubpro directory).

**`ERR_CRYPTO_INVALID_IV` / "Invalid initialization vector" in the server log, and login or
passkey breaking** — `users.apiKey` holds a value Payload cannot decrypt, and its `afterRead`
hook throws on every read of that user. Recover with
`node scripts/mcp-api-key.mjs --email you@orcaclub.pro --clear --yes`, then re-provision with
`--set`. Commenting out `useAPIKey` and redeploying also stops it immediately, since the field
and its hook disappear.

**`Route not found "/api/mcp"`** — the dev server was started before the route existed.
Turbopack does not hot-add new routes. Restart it.

**`403 — staff only`** — the key belongs to a `client`-role user. MCP is staff only.

**Tools list is empty or stale** — restart Claude Code. The tool list is read at connect time.

---

## Using the deployed site instead of localhost

The endpoint and the `useAPIKey` setting both have to be deployed first. Once they are, swap
the URL:

```bash
claude mcp remove orcaclub
claude mcp add --transport http orcaclub https://orcaclub.pro/api/mcp \
  --header "Authorization: users API-Key YOUR_KEY_HERE"
```

The same key works for both — it belongs to your user, not to an environment.

---

## Claude desktop

Custom connectors authenticate through OAuth only; there is no way to attach a static API-key
header, and Anthropic's servers connect from their own infrastructure, so they hit the same
401. Bridge it locally instead — in
`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "orcaclub": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://orcaclub.pro/api/mcp",
               "--header", "Authorization: users API-Key YOUR_KEY_HERE"]
    }
  }
}
```

Untested against this endpoint. Claude Code is the better fit for recap drafting anyway —
reading a cycle, writing prose, saving, and moving to the next client is a terminal workflow.

---

## What Claude can do

| Group | Tools |
|-------|-------|
| Reporting | `get_recap_draft`, `save_recap_draft`, `get_scope_recap` |
| Work logs | `log_work`, `create_draft_entry`, `update_time_entry` |
| Packages & SOW | `list_packages`, `create_package`, `get_sow_draft`, `save_sow` |
| Milestones | `create_milestone`, `update_milestone`, `toggle_milestone` |
| Context | `list_clients`, `get_retainer_portfolio`, `get_retainer_summary` |

Recap drafts store **narrative only**. Every number — hours used, items shipped, per-bucket
hours, plan terms — is re-derived from the cycle when read, so a draft can never carry a wrong
figure to a client. Implementation notes are in the MCP section of `CLAUDE.md`.
