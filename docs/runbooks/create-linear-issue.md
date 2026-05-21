# Runbook — Create a Linear issue

**When to use:** any time you start a task on Pulse — bug, feature, improvement, tech debt. Every change should have a Linear issue.

**Time:** ~1 minute (UI) or one API call.

---

## Rules

1. **Project:** "Emotional Pulse - Mobile Native"
2. **Assignee:** Dylan (unless explicitly someone else)
3. **Labels:** At minimum one **type** label AND one **component** label
4. **Initial state:** "Todo" or "In Progress" if you're starting immediately
5. **When done:** set state to "Done" (after OTA / native release ships)

## Two ways to do it

### Option A — Linear UI (easiest)

1. Open <https://linear.app/sharetree>
2. Navigate to project **"Emotional Pulse - Mobile Native"**
3. Press `C` to create an issue
4. Title: short imperative ("Fix sign-up button alignment on iPhone SE")
5. Description: what's changing and why
6. Add a **type** label (Bug / Improvement / Feature)
7. Add at least one **component** label (see table below)
8. Assign to Dylan
9. Submit

### Option B — GraphQL API (for batches)

The Linear API key is in [`.mcp.json`](../../.mcp.json) at the repo root under `mcpServers.linear.env.LINEAR_API_KEY`.

```bash
LINEAR_KEY="$(jq -r '.mcpServers.linear.env.LINEAR_API_KEY' .mcp.json)"

curl -s https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  -d '{"query": "mutation { issueCreate(input: { teamId: \"3a9c3ade-820f-4b28-bb82-7ca92d1d793c\", projectId: \"8f70ccd1-403d-4d02-8c7d-703b24ead9ad\", title: \"Issue title\", description: \"What and why.\", stateId: \"c70c72ed-278f-4a6a-821e-ec1c6beeb785\", assigneeId: \"0fd668b1-c76e-4e88-a615-657adff4629a\", labelIds: [\"<type-label-id>\", \"<component-label-id>\"] }) { success issue { id identifier url } } }"}'
```

To create multiple issues in one call, use aliases:

```graphql
mutation {
  i1: issueCreate(input: { ...issue 1... }) { success issue { identifier url } }
  i2: issueCreate(input: { ...issue 2... }) { success issue { identifier url } }
}
```

## To mark an issue Done

```bash
curl -s https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_KEY" \
  -d '{"query": "mutation { issueUpdate(id: \"<issue-id>\", input: { stateId: \"8553ccfd-feb1-4676-8863-8d84fc0067cd\" }) { success } }"}'
```

---

## ID reference

These IDs rarely change. If something seems wrong, run a Linear query (`query { teams { id name } }` etc.) to refresh.

### Core IDs

| Entity | ID |
|---|---|
| **Team** (ShareTree) | `3a9c3ade-820f-4b28-bb82-7ca92d1d793c` |
| **Project** (Emotional Pulse - Mobile Native) | `8f70ccd1-403d-4d02-8c7d-703b24ead9ad` |
| **Assignee** (Dylan) | `0fd668b1-c76e-4e88-a615-657adff4629a` |

### Workflow states

| State | ID |
|---|---|
| Backlog | `88e33fb6-c5bc-4997-a52d-c11b55be9435` |
| Todo | `c70c72ed-278f-4a6a-821e-ec1c6beeb785` |
| In Progress | `2025195d-838e-4575-9c5b-d1895939283e` |
| To Test | `7224eaa9-5c42-48cf-a63f-383701a7c5e5` |
| Done | `8553ccfd-feb1-4676-8863-8d84fc0067cd` |
| Canceled | `3795fc0d-3358-47ad-9119-287b61896400` |

### Type labels (pick exactly one)

| Label | ID |
|---|---|
| Bug | `a2d90dbc-b38a-4d01-9e4f-2b3401a9ac07` |
| Improvement | `ad02c8be-43e0-4236-a1ee-72f8fd7fe8d9` |
| Feature | `49ebd6b2-8889-4da1-b582-f46905c66209` |

### Component labels (pick at least one — multiple OK if the change spans areas)

| Label | When to use | ID |
|---|---|---|
| Mobile App | Cross-cutting / unsure | `526c3162-6c30-4a02-bd5e-57767ac0364a` |
| Pulse Check-in Engine | The check-in flow (slider, grid, emotions) | `e85c1cf7-5439-497b-8b2f-ff4a67ff58e9` |
| Pairs | Peer-support pairs (invite, list, profile) | `3e792e1d-3281-4111-89b8-45c820423f26` |
| Groups | Group cohorts | `bda7c521-c7e1-4d65-9cde-2fffb9190658` |
| Courses | Lessons & enrollments | `edbf42c2-5196-42bc-a94e-4d750e1c1ce6` |
| Navigation | Routes, tab bar, deep links | `35cda61f-d160-46c5-9317-21fef031b5e8` |
| Onboarding | First-launch / onboarding flow | `e1ca6d4e-8463-4854-8b78-17e8c18252e8` |
| MHFR | Mental Health First Responder features | `5b5eff7d-eed5-425f-be4e-018c2d2060ec` |
| Authentification | Sign-in / sign-up / SSO | `96322384-ce47-4c00-a9e9-2f72f2339660` |
| Support Request | Support request creation/routing | `0633ed49-903b-417a-9066-54945f385647` |
| Admin Section | Admin / internal screens | `e0d95edb-eb0b-450f-b755-3a2f3b82f639` |
| UX, Responsiveness & Performance | Polish / perf / cross-screen UX | `ede2470d-d590-4687-9bd2-e36ffeccd809` |
| Testing | Tests, mocks, CI | `e5b17d2f-9f4b-47a4-b05d-35ec726faa31` |
| Tech Debt | Refactors, cleanup, infra | `d9fff624-021d-488e-9052-93bc49ac96a6` |

## Tips

- Lifecycle: **Todo → In Progress → To Test → Done** is the standard flow. Skip "To Test" if there's no QA cycle.
- **EP-NNN** identifiers are auto-assigned by Linear when the issue is created — you don't pick them.
- The Linear MCP server in [`.mcp.json`](../../.mcp.json) lets Claude Code create issues directly. If you're using Claude, just ask.
