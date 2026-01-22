# Worktree Maestro

MCP server for git worktree management with iTerm2 integration, designed for parallel development workflows with Claude Code.

## Pain Points Solved

| Problem | Solution |
|---------|----------|
| Verbose git worktree commands | Single command with smart defaults |
| Manual .env file copying | Auto-copies all env files |
| Manual dependency installation | Auto-detects and runs npm/pnpm/yarn/bun |
| Port confusion with dev servers | Auto-assigns unique ports |
| Directory clutter | Clean structure in ~/worktrees/ |
| Tab tracking overhead | iTerm2 integration with auto-naming |
| PR workflow friction | One command: commit, push, create PR |

## Installation

### As a Claude Code Plugin (Recommended)

```bash
# Clone and build
cd /path/to/worktree-maestro
pnpm install
pnpm run build

# Install as plugin
claude plugin add /path/to/worktree-maestro
```

### As MCP Server Only

```bash
# Add to Claude Code
claude mcp add worktree-maestro -- node /path/to/worktree-maestro/dist/index.js
```

## Slash Commands

When installed as a plugin, you get quick slash commands:

| Command | Description |
|---------|-------------|
| `/wt` | List all worktrees with status |
| `/wt-create PROJ-123 name` | Create worktree (with optional iTerm mode: `split-v`, `split-h`) |
| `/wt-switch name` | Switch to worktree by name/ticket |
| `/wt-clean name` | Remove worktree and cleanup |
| `/wt-pr name` | Create GitHub PR from worktree |
| `/wt-config` | View or update configuration |

### Examples

```bash
/wt                              # List all worktrees
/wt-create PROJ-123 user-auth    # Create with ticket
/wt-create auth-fix split-v      # Create with vertical split
/wt-switch auth                  # Switch to matching worktree
/wt-pr PROJ-123 draft            # Create draft PR
/wt-config set branchPrefix feat/  # Update config
```

## Tools

### create_worktree

Create a new worktree with full setup automation.

```
"Create worktree for PROJ-123 called user-authentication"
```

**What happens:**
1. Creates `~/worktrees/myrepo-PROJ-123-user-authentication/`
2. Creates branch `feature/PROJ-123-user-authentication`
3. Copies `.env`, `.env.local`, etc.
4. Runs `pnpm install` (or npm/yarn/bun)
5. Opens new iTerm tab named `PROJ-123-user-authentication`
6. Assigns port 3001 (or next available)

### list_worktrees

View all worktrees with status.

```
"Show my worktrees"
```

**Output:**
```
| Name                    | Branch           | Status | Changes |
|-------------------------|------------------|--------|---------|
| PROJ-123-user-auth      | feature/PROJ-... | dirty  | 3 files |
| PROJ-456-payments       | feature/PROJ-... | clean  | -       |
| hotfix-login            | hotfix/login-fix | clean  | -       |
```

### switch_worktree

Switch to a worktree in iTerm.

```
"Switch to PROJ-123"
```

- Switches to existing tab if open
- Opens new tab if not
- Supports partial matching

### cleanup_worktree

Remove a worktree and clean up.

```
"Clean up PROJ-123 worktree"
```

**Actions:**
- Closes iTerm tab
- Releases port
- Removes worktree directory
- Deletes branch

**Safety:** Warns if uncommitted changes exist.

### create_pr

Create a GitHub PR from a worktree.

```
"Create PR for PROJ-123"
```

**Workflow:**
1. Commits any uncommitted changes
2. Pushes branch to origin
3. Creates PR with auto-generated title/body

**Requires:** `gh` CLI installed and authenticated.

## Configuration

Config file: `~/.worktree-maestro/config.json`

```json
{
  "baseDirectory": "~/worktrees",
  "portRangeStart": 3001,
  "portRangeEnd": 3099,
  "envFilesToCopy": [".env", ".env.local", ".env.development"],
  "postCreateCommands": [],
  "defaultBaseBranch": "main",
  "branchPrefix": "feature/"
}
```

## Directory Structure

```
~/worktrees/
├── myapp-PROJ-123-user-auth/      # ticket + name
├── myapp-PROJ-456-payments/
├── myapp-hotfix-login/            # no ticket
└── other-repo-ISSUE-42-feature/
```

## Requirements

- macOS with iTerm2
- Node.js 18+
- Git
- GitHub CLI (`gh`) for PR creation

## Real-World Workflows

### Parallel Feature Development

```
You: "Create worktree for PROJ-123 user authentication"
You: "Create worktree for PROJ-456 payment integration"

# Now working in 3 tabs: main + 2 features
# Each has its own deps, env, and port
```

### Emergency Hotfix

```
# Deep in feature work, production breaks

You: "Create worktree for hotfix login crash from main"
# Fix the issue in new tab
You: "Create PR for hotfix-login"
# Merged, back to feature work
You: "Clean up hotfix-login worktree"
```

### A/B Implementation

```
You: "Create worktree called approach-redux"
You: "Create worktree called approach-zustand"

# Implement both, compare, keep the winner
```

### Let Claude Work in Background

```
# In your main worktree, you're coding

You: "In the refactor-api worktree, refactor all API calls"
# Claude works in separate worktree
# Your files untouched
```

## License

MIT
