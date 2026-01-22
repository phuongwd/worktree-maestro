---
description: List all git worktrees with status
arguments:
  - name: repo
    description: Filter by source repository path (optional)
    required: false
---

Use the `list_worktrees` MCP tool with `verbose: true` and `allRepos: true` to show all worktrees.

If `repo` argument is provided, pass it to filter worktrees from that specific repository.

Display the results in a clear table format showing:
- Repository (if multiple repos)
- Name
- Branch
- Status (clean/dirty)
- Changed files count
- Port (if assigned)
- iTerm tab status
