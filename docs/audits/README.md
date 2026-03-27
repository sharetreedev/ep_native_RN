# Audits

This folder contains structured code audits for the Pulse project. Each audit lives in its own folder and follows a consistent format so that both humans and agents can create, track, and complete audits reliably.

---

## Folder Structure

```
docs/audits/
  README.md                          <-- You are here (guide for structuring audits)
  AUDITTYPE-YYYYMMDD-STATUS/
    report.md                        <-- The audit findings
    tasks.md                         <-- Actionable remediation tasks with status tracking
```

### Naming Convention

**Folder name:** `AUDITTYPE-YYYYMMDD-STATUS`

- `AUDITTYPE`: Uppercase, no separators (e.g. `CODEQUALITY`, `SECURITY`, `PERFORMANCE`, `ACCESSIBILITY`, `DEPENDENCY`)
- `YYYYMMDD`: Date the audit was conducted, no separators
- `STATUS`: One of `INCOMPLETE`, `INPROGRESS`, `COMPLETE`

**Examples:**
- `CODEQUALITY-20260325-INCOMPLETE/`
- `SECURITY-20260410-INPROGRESS/`
- `PERFORMANCE-20260501-COMPLETE/`

### Updating Status

When the status of an audit changes, **rename the folder** to reflect the new status. This keeps the status visible at a glance in file explorers and terminal listings without needing to open any files. Also update the `Status` field in `report.md` to match.

---

## report.md Format

Every audit report must include:

```markdown
# [Project Name] — [Audit Type] Audit

**Date:** YYYY-MM-DD
**Audit Type:** [Description]
**Status:** Incomplete | In Progress | Complete

---

## Executive Summary
[2-3 sentence overview of findings]

## Findings
[Numbered sections, each with: description, evidence/metrics, recommendation]

## What's Working Well
[Positive findings worth preserving]

## Metrics
[Tables with file sizes, scores, or counts as appropriate]
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| **Incomplete** | Audit complete, remediation tasks not yet started |
| **In Progress** | Some tasks have been addressed |
| **Complete** | All tasks resolved or explicitly deferred |

---

## tasks.md Format

Every audit must have an accompanying task list:

```markdown
# [Audit Type] Audit — Tasks

**Audit Date:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD

## Tasks

- [ ] Task description — *[Priority: High/Medium/Low]* — `affected files or areas`
- [ ] ...

## Deferred

- [ ] Task description — *Reason for deferral*
```

### Rules for Tasks

1. Each finding in the report should map to one or more tasks
2. Tasks must include priority level and affected files/areas
3. When a task is completed, check it off and note the date: `- [x] Task — completed 2026-04-01`
4. Tasks that won't be addressed should be moved to a **Deferred** section with a reason
5. When all tasks are complete or deferred, update `report.md` status to **Complete**

---

## Creating a New Audit

1. Create a folder: `docs/audits/AUDITTYPE-YYYYMMDD-INCOMPLETE/`
2. Write `report.md` with findings, set status to **Incomplete**
3. Write `tasks.md` with actionable items derived from findings
4. As work progresses, update task checkboxes, report status, and rename the folder to match (e.g. `INCOMPLETE` → `INPROGRESS` → `COMPLETE`)
