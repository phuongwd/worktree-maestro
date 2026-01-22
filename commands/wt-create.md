---
description: Create a new git worktree
arguments:
  - name: ticket
    description: Ticket ID (e.g., PROJ-123)
    required: false
  - name: name
    description: Short name for the worktree (e.g., user-auth)
    required: true
  - name: mode
    description: "iTerm mode: tab, split-h, split-v"
    required: false
    default: tab
  - name: repo
    description: Path to source repository (for global use)
    required: false
---

Use the `create_worktree` MCP tool to create a new worktree.

Parse the arguments:
- If `ticket` is provided, use it as the ticket parameter
- `name` is the worktree name (required)
- `mode` determines iTerm behavior:
  - `tab` or empty → `itermMode: "tab"`
  - `split-h` or `h` → `itermMode: "split-horizontal"`
  - `split-v` or `v` → `itermMode: "split-vertical"`
- `repo` is the source repository path (optional, defaults to current directory)

Example usages:
- `/wt-create PROJ-123 user-auth` → creates with ticket
- `/wt-create auth-fix` → creates without ticket
- `/wt-create PROJ-123 user-auth split-v` → creates with vertical split
- `/wt-create PROJ-123 auth-fix tab ~/projects/myapp` → creates from specific repo

Call the MCP tool and report the result including:
- Worktree path
- Branch name
- Source repository
- Whether dependencies were installed
- iTerm status
