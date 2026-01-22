---
description: Remove a worktree and clean up resources
arguments:
  - name: name
    description: Worktree name, ticket ID, or partial match
    required: true
  - name: force
    description: Force removal even with uncommitted changes
    required: false
    default: "false"
---

Use the `cleanup_worktree` MCP tool to remove a worktree.

Parse the arguments:
- `name` supports partial matching
- `force` can be "true", "yes", "1", or "-f" to force removal

Example usages:
- `/wt-clean PROJ-123` → clean up worktree matching PROJ-123
- `/wt-clean auth` → clean up worktree matching "auth"
- `/wt-clean PROJ-123 force` → force clean even with changes

The tool will:
- Close associated iTerm tab
- Release port assignment
- Remove worktree directory
- Delete the branch

Report all actions taken and any warnings.
