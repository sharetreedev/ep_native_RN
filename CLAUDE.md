# Pulse 4.0 - React Native Mobile App

## Linear Integration

When working on tasks in this project:
- **Create a Linear issue** in the project "Emotional Pulse - Mobile Native" for each task requested
- **Apply appropriate labels** from the project — both the type (bug, improvement, feature) and the relevant app component labels that match the area of the app being worked on
- **When a task is completed**, update the Linear issue status to "Done"
- Use the Linear GraphQL API directly (`https://api.linear.app/graphql`) — read the API key from `.mcp.json`
- All IDs (team, project, assignee, labels, workflow states) are cached in the memory file `project_linear_workflow.md` — no need to fetch them each session

## OTA Update Workflow

When the user asks to "push OTA", "OTA update", or similar — follow these steps in order:

### 1. Publish the update
```bash
eas update --channel production --message "<brief summary of changes>"
```
- Use the `production` channel (from `eas.json`)
- The message should summarize what changed — infer from conversation history or ask the user

### 2. Create Linear issues
- Create a Linear issue for each piece of work included in this update
- Use the Linear GraphQL API — all IDs and labels are in the memory file `project_linear_workflow.md`
- Mark all issues as **Done** (they're live once OTA is published)
- Assign to Dylan

### 3. Post to Microsoft Teams via Zapier
- **Webhook URL:** `https://hooks.zapier.com/hooks/catch/7314441/un0q5pa/`
- Send a POST request with a plain text `message` field:
  ```bash
  curl -X POST "https://hooks.zapier.com/hooks/catch/7314441/un0q5pa/" \
    -H "Content-Type: application/json" \
    -d '{"message": "<plain text message>"}'
  ```
- Format the `message` as plain text, example:
  ```
  Pulse OTA Update Pushed

  Changes:
  - EP-742: Pairs list name truncation (https://linear.app/sharetree/issue/EP-742)
  - EP-743: Timeline view layout improvements (https://linear.app/sharetree/issue/EP-743)

  EAS Update Group: <group-id>
  ```

### Notes
- If unsure what work was done, check `git log` since the last update or ask the user
- You can batch multiple Linear issue creates in a single GraphQL mutation using aliases

## Project Details

- This is a React Native (Expo) mobile app
- Backend API: Xano (https://xdny-scc5-yag9.a2.xano.io/api:LmTnxskw)
