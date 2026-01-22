---
description: Create a GitHub PR from a worktree
arguments:
  - name: name
    description: Worktree name, ticket ID, or partial match
    required: true
  - name: draft
    description: Create as draft PR
    required: false
    default: "false"
---

Use the `create_pr` MCP tool to create a GitHub pull request.

Parse the arguments:
- `name` supports partial matching to find the worktree
- `draft` can be "true", "yes", "1", or "-d" for draft PR

Example usages:
- `/wt-pr PROJ-123` → create PR for worktree matching PROJ-123
- `/wt-pr auth draft` → create draft PR for worktree matching "auth"

The tool will:
1. Commit any uncommitted changes
2. Push the branch to origin
3. Create the PR via GitHub CLI

Report the PR URL when complete.

Note: Requires GitHub CLI (gh) to be installed and authenticated.
