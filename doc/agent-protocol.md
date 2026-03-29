# Agent Communication & Coordination Protocol

## Agents
| Agent | ID | Directory |
|-------|----|-----------|
| Project Manager | `pm` | `doc/pm/` |
| Developer | `developer` | `doc/developer/` |
| Researcher | `researcher` | `doc/researcher/` |
| Tester | `tester` | `doc/tester/` |

## Directory Structure
```
doc/<agent>/
  memo/    # Agent's private working notes, research, decisions
  inbox/   # Messages from other agents or humans
```

## Message Format
Files in `inbox/` are named: `YYYY-MM-DD-<from>-<subject-slug>.md`

Frontmatter:
```yaml
---
from: <agent-id>
to: <agent-id>
date: YYYY-MM-DD
status: new | read | done
subject: <human-readable subject>
---
```

## Workflow
1. Agent checks `inbox/` at the start of each session
2. Mark messages `status: read` when acknowledged
3. Mark messages `status: done` when the requested work is complete
4. Reply by dropping a new file in the sender's `inbox/`

## Branch & Worktree Convention
- Each agent works in an isolated worktree (managed by Superset.sh)
- Branch naming: `<agent-id>/<short-description>`
- Merge to `main` when work is reviewed and complete
- Never force-push to `main`

## Escalation
- If blocked, message `pm` inbox with `[BLOCKED]` in the subject
- PM resolves conflicts and re-prioritizes as needed

## Code Ownership
All agents can read all code. Write conventions:
- `src/` and `tests/` — Developer writes, Tester writes tests
- `doc/` — All agents write to their own directories
- `CLAUDE.md` — PM maintains
