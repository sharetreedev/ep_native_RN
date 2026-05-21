# Runbook — Write a Teams release-note

**When to use:** every time an OTA goes live (and for native releases too).

**Audience:** End users of the Pulse app — Sharetree staff and member orgs. They have **never seen the codebase**, don't know what an "OTA" is, and only care about what's different when they open the app.

**Time:** ~5 minutes.

---

## The webhook

```bash
curl -X POST "https://hook.eu2.make.com/kk8btnn8wjnnuwpdup0wle6a08wulr2y" \
  -H "Content-Type: application/json" \
  -d '{"message": "<p>HTML message here</p>", "user": "Dylan"}'
```

Two fields:

- **`message`** — the post body as **HTML** (`<p>`, `<ul>`, `<li>`, line breaks all render). Make posts this to the Teams channel.
- **`user`** — who the message is from. Only **`Dylan`** and **`Maurice`** are configured in the Make scenario. Anything else will fall back, so don't make up a name.

> **Before sending, always confirm who the post is from.** If someone other than Dylan or Maurice is mentioned, send it as **Maurice** and tell the requester that the named user isn't set up in the Make workflow.

---

## Rules — read these every time

1. **Lead with user impact, not the cause.** "Sign-up is faster" — not "refactored AuthScreen form layout".
2. **Each bullet describes what the user will see or feel,** in plain language. Strip every framework name, file path, component name, hook name, and acronym (no "MHFR refactor", no "context provider split", no "EmotionBadge").
3. **Group all backend / refactor / perf work into ONE catch-all line** — never list it ticket-by-ticket. Example: "Behind the scenes: a stability and performance pass — the app should feel snappier all round."
4. **No Linear links, no EP numbers, no update group IDs, no commit hashes** in the user-facing message. Those are the engineering record (in Linear and `git log`), not the user story.
5. **Always end with a concrete action** the user can take to receive the update — usually "Close and reopen Pulse to get the update."
6. **If something went wrong** (data integrity, sign-in confusion, lost work): acknowledge it honestly, explain who it may have affected in plain terms, and offer a recovery path ("give us a shout — we can get them restored"). Never hide impact.
7. **Friendly register, not corporate.** "A few quality-of-life improvements" beats "This release contains the following enhancements".
8. **Open with one of:**
   - `Pulse update just went out ✨` (features / improvements)
   - `Pulse update just went out 📲` (fix / incident)

   Pick the emoji to match the vibe.

---

## Templates

### Features / improvements release

```
Pulse update just went out ✨

A few quality-of-life improvements:

- <user-visible change in plain language>
- <user-visible change in plain language>
- <user-visible change in plain language>
- Behind the scenes: <one-line summary of any refactor / perf / tech-debt work, framed as "the app should feel ..."> 

Close and reopen Pulse to get the update.
```

### Fix / incident release

```
Pulse update just went out 📲

We fixed <plain-language description of the issue and who it may have affected>. <One sentence on what's now correct.>

What you need to do: fully close and reopen the Pulse app to pick up the latest version. <If relevant: recovery path — "if you ... give us a shout, we can get them restored".>
```

---

## Worked examples

### Features release (real example — the EP-801 → EP-808 batch)

```
Pulse update just went out ✨

A few quality-of-life improvements:

- Sign up is faster — first and last name now sit on a single row, and the Microsoft and mobile sign-up buttons are clearer about what they do
- Cleaner check-in grid — fixed a brief colour flicker when the grid first loads
- Profile screen polish — the emotion badge under your avatar now sits a bit lower so it breathes better
- Support requests — your pairs list now only shows people you can actually call (accepted invites with a phone number)
- Behind the scenes: a big stability and performance pass across Groups, Pairs, MHFR support, and the support request flow — the app should feel snappier all round

Close and reopen Pulse to get the update.
```

Notice:
- Each bullet is something a user could **point at on their phone**
- No mention of "refactor", "Context", "useMHFR", or any file names
- The catch-all "Behind the scenes" line covers all the refactor work in one bite
- Ends with the action

### Incident release (real example — the env-source hardening fix)

```
Pulse update just went out 📲

We fixed a behind-the-scenes issue where some people signing in over the last week may have been connecting to a test environment instead of their real Pulse account. Everyone is now reliably signing in to the correct account.

What you need to do: fully close and reopen the Pulse app to pick up the latest version. If you created any check-ins or invited any pairs in the last week and don't see them when you log back in, give us a shout — we can get them restored.
```

Notice:
- Honest about what happened, in user terms ("connecting to a test environment instead of their real Pulse account")
- Says who might have been affected
- Offers a recovery path

---

## Quick example — full curl invocation

```bash
curl -X POST "https://hook.eu2.make.com/kk8btnn8wjnnuwpdup0wle6a08wulr2y" \
  -H "Content-Type: application/json" \
  -d '{"message": "<p>Pulse update just went out ✨</p><p>A few quality-of-life improvements:</p><ul><li>Sign up is faster — first and last name now sit on a single row</li><li>Cleaner check-in grid — fixed a brief colour flicker</li></ul><p>Close and reopen Pulse to get the update.</p>", "user": "Dylan"}'
```

The webhook returns `Accepted` on success.

## A note on the internal record

The Linear issues and your commit messages keep the **engineering** record (EP numbers, EAS update group IDs, file paths, commit SHAs). The Teams message is for users — keep these separate.

## Related

- [Push an OTA](./push-ota.md) — the publish that you're announcing
- [`CLAUDE.md`](../../CLAUDE.md) — the same rules in machine-readable form (Claude Code uses this)
