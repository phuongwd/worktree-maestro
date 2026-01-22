---
description: Switch to a worktree in iTerm
arguments:
  - name: name
    description: Worktree name, ticket ID, or partial match
    required: true
  - name: mode
    description: "iTerm mode: tab, split-h, split-v"
    required: false
    default: tab
---

Use the `switch_worktree` MCP tool to switch to a worktree.

Parse the arguments:
- `name` supports partial matching (e.g., "auth" matches "PROJ-123-user-auth")
- `mode` determines how to open:
  - `tab` or empty → `mode: "tab"`
  - `split-h` or `h` → `mode: "split-horizontal"`
  - `split-v` or `v` → `mode: "split-vertical"`

Example usages:
- `/wt-switch auth` → switch to worktree matching "auth"
- `/wt-switch PROJ-123` → switch to worktree with ticket PROJ-123
- `/wt-switch auth split-v` → open in vertical split

Report the result including whether it switched to existing tab or opened new one.
