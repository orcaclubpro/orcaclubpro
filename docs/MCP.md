# MCP Quick Start

Connect Claude to ORCACLUB so it can draft cycle recaps, log work, build packages and SOWs,
and manage milestones. Runs on your Claude subscription — no API key, no per-use billing.

Claude drafts. You review and send. No tool here touches Stripe, creates an order, or emails
a client.

---

## 1. Get your API key

Start the app:

```bash
bun run bun:dev
```

Then in the browser:

1. Go to `http://localhost:3000/admin` — check the startup log for the port; if 3000 was
   taken it will say `using available port 3001 instead`
2. **Collections → Users →** click your own user
3. Tick **Enable API Key**
4. **Save** — do this before copying anything
5. Copy the key from the **API Key** field

**The step everyone misses:** copying the key before hitting Save. The key field populates as
soon as you tick the box, but the key does not work until the record is saved with
`enableAPIKey` set. A key copied from an unsaved form is a valid-looking UUID that fails auth.
If you hit a 401, redo this step first.

Treat the key like a password — it carries your full staff role. Revoke it by unticking the
box and saving.

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

- `{"user":null,...}` → Payload is rejecting the key. Go back to step 1: the usual cause is
  **Enable API Key was never saved**. Re-tick it, save, copy the key again.
- Returns your user → the key is good, so the problem is in the Claude config. Check the
  header is `users API-Key <key>` (not `Bearer`), and that the server is registered to this
  project (`claude mcp list` from the orcaclubpro directory).

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
