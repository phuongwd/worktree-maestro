---
description: View or update worktree-maestro configuration
arguments:
  - name: action
    description: "Action: show (default), set"
    required: false
    default: show
  - name: key
    description: Config key to set
    required: false
  - name: value
    description: Value to set
    required: false
---

Use the `get_config` or `set_config` MCP tools to manage configuration.

## Show config (default)
If no arguments or `action` is "show":
- Use `get_config` tool
- Display all settings in a readable format

## Set config
If `action` is "set" and `key`/`value` are provided:
- Use `set_config` tool with the key-value pair

Available config keys:
- `baseDirectory` - Where worktrees are created (default: ~/worktrees)
- `portRangeStart` - Start of port range (default: 3001)
- `portRangeEnd` - End of port range (default: 3099)
- `defaultBaseBranch` - Default base branch (default: main)
- `branchPrefix` - Branch name prefix (default: feature/)

Example usages:
- `/wt-config` → show all config
- `/wt-config show` → show all config
- `/wt-config set baseDirectory ~/projects/worktrees` → update base directory
- `/wt-config set branchPrefix feat/` → update branch prefix
