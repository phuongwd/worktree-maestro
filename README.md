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
| Managing worktrees across projects | Global tracking of all worktrees |

## Installation

### Quick Install (Recommended)

```bash
git clone https://github.com/phuongwd/worktree-maestro.git
cd worktree-maestro
./install.sh
```

The install script will:
- Install dependencies and build
- Add MCP server to Claude Code
- Copy skills to `~/.claude/skills/`

Then **restart Claude Code** to load the changes.

### Manual Installation

<details>
<summary>Click to expand manual steps</summary>

#### Step 1: Clone and Build

```bash
git clone https://github.com/phuongwd/worktree-maestro.git
cd worktree-maestro
pnpm install
pnpm run build
```

#### Step 2: Add MCP Server

```bash
claude mcp add --scope user worktree-maestro -- node /path/to/worktree-maestro/dist/index.js
```

#### Step 3: Install Skills

```bash
cp -r /path/to/worktree-maestro/skills/* ~/.claude/skills/
```

#### Step 4: Restart Claude Code

</details>

### Uninstall

```bash
cd worktree-maestro
./uninstall.sh
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/wt` | List all worktrees with status |
| `/wt-create [ticket] <name> [mode]` | Create worktree with optional iTerm mode |
| `/wt-switch <name> [mode]` | Switch to worktree by name/ticket |
| `/wt-clean <name> [force]` | Remove worktree and cleanup |
| `/wt-pr <name> [draft]` | Create GitHub PR from worktree |
| `/wt-config [set key value]` | View or update configuration |

**iTerm modes:** `tab` (default), `split-h`, `split-v`

### Examples

```bash
/wt                              # List all worktrees
/wt-create PROJ-123 user-auth    # Create with ticket
/wt-create auth-fix split-v      # Create with vertical split
/wt-switch auth                  # Switch to matching worktree
/wt-pr PROJ-123 draft            # Create draft PR
/wt-config set branchPrefix feat/  # Update config
```

## MCP Tools

You can also use natural language with Claude:

| Tool | Example |
|------|---------|
| `create_worktree` | "Create worktree for PROJ-123 called user-auth" |
| `list_worktrees` | "Show my worktrees" |
| `switch_worktree` | "Switch to PROJ-123" |
| `cleanup_worktree` | "Clean up the auth worktree" |
| `create_pr` | "Create PR for PROJ-123" |
| `get_config` | "Show worktree config" |
| `set_config` | "Set branch prefix to feat/" |

## What Happens When You Create a Worktree

1. Creates `~/worktrees/<repo>-<ticket>-<name>/`
2. Creates branch `feature/<ticket>-<name>`
3. Copies `.env`, `.env.local`, `.env.development`, etc.
4. Runs `pnpm install` (or npm/yarn/bun)
5. Opens new iTerm tab (or split pane)
6. Assigns unique port (3001-3099)
7. Tracks worktree for global access

## Configuration

Config file: `~/.worktree-maestro/config.json`

| Setting | Default | Description |
|---------|---------|-------------|
| `baseDirectory` | `~/worktrees` | Where worktrees are created |
| `portRangeStart` | `3001` | Start of port range |
| `portRangeEnd` | `3099` | End of port range |
| `defaultBaseBranch` | `main` | Default base branch |
| `branchPrefix` | `feature/` | Prefix for new branches |
| `envFilesToCopy` | `.env`, `.env.local`, etc. | Env files to copy |

## Directory Structure

```
~/worktrees/
├── myapp-PROJ-123-user-auth/
├── myapp-PROJ-456-payments/
├── myapp-hotfix-login/
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
/wt-create PROJ-123 user-auth
/wt-create PROJ-456 payments

# Now working in 3 tabs: main + 2 features
# Each has its own deps, env, and port
```

### Emergency Hotfix

```
# Deep in feature work, production breaks
/wt-create hotfix-login-crash
# Fix the issue in new tab
/wt-pr hotfix-login-crash
# Merged, back to feature work
/wt-clean hotfix-login-crash
```

### Split Pane Workflow

```
# Open feature in vertical split (side by side)
/wt-switch auth split-v

# Open in horizontal split (top/bottom)
/wt-create PROJ-789 api-refactor split-h
```

### Let Claude Work in Background

```
# In your main worktree, you're coding
# Claude works in separate worktree
"In the refactor-api worktree, refactor all API calls"
# Your files untouched
```

## License

MIT
