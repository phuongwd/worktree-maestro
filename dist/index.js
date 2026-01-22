#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { createWorktreeTool, createWorktreeSchema, listWorktreesTool, listWorktreesSchema, cleanupWorktreeTool, cleanupWorktreeSchema, switchWorktreeTool, switchWorktreeSchema, createPrTool, createPrSchema, } from './tools/index.js';
const server = new Server({
    name: 'worktree-maestro',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'create_worktree',
                description: `Create a new git worktree with automatic setup.

Features:
- Creates worktree in ~/worktrees/<repo>-<ticket>-<name>
- Creates new branch from base (default: main)
- Copies .env files automatically
- Installs dependencies (detects npm/pnpm/yarn/bun)
- Opens new iTerm tab
- Assigns unique port for dev server

Example: Create worktree for ticket PROJ-123 called "user-auth"`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        ticket: {
                            type: 'string',
                            description: 'Ticket/issue ID (e.g., PROJ-123, GH-456)',
                        },
                        name: {
                            type: 'string',
                            description: 'Short descriptive name (e.g., user-auth, fix-login)',
                        },
                        baseBranch: {
                            type: 'string',
                            description: 'Base branch to create from (defaults to main)',
                        },
                        openInIterm: {
                            type: 'boolean',
                            description: 'Open in new iTerm tab (default: true)',
                            default: true,
                        },
                        installDeps: {
                            type: 'boolean',
                            description: 'Install dependencies (default: true)',
                            default: true,
                        },
                        copyEnv: {
                            type: 'boolean',
                            description: 'Copy .env files (default: true)',
                            default: true,
                        },
                        startServer: {
                            type: 'boolean',
                            description: 'Start dev server (default: false)',
                            default: false,
                        },
                        port: {
                            type: 'number',
                            description: 'Specific port for dev server',
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'list_worktrees',
                description: `List all git worktrees with status information.

Shows:
- Worktree name and path
- Branch name
- Clean/dirty status
- Number of changed files
- Assigned port
- iTerm tab status

Returns formatted table for easy viewing.`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeMain: {
                            type: 'boolean',
                            description: 'Include main working directory (default: true)',
                            default: true,
                        },
                        verbose: {
                            type: 'boolean',
                            description: 'Show additional details like ports (default: false)',
                            default: false,
                        },
                    },
                },
            },
            {
                name: 'switch_worktree',
                description: `Switch to a worktree in iTerm.

Behavior:
- If tab exists for worktree: switches to it
- If no tab exists: opens new tab
- Supports partial matching on name/ticket/branch

Example: Switch to PROJ-123 or "user-auth"`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Worktree name, ticket ID, or partial match',
                        },
                        openNewTab: {
                            type: 'boolean',
                            description: 'Force open new tab even if one exists (default: false)',
                            default: false,
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'cleanup_worktree',
                description: `Remove a worktree and clean up associated resources.

Actions:
- Closes iTerm tab (if open)
- Releases port assignment
- Removes worktree directory
- Deletes branch (optional)

Safety:
- Warns if uncommitted changes exist
- Requires force=true to remove dirty worktrees`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Worktree name, ticket ID, or partial match',
                        },
                        deleteBranch: {
                            type: 'boolean',
                            description: 'Delete associated branch (default: true)',
                            default: true,
                        },
                        force: {
                            type: 'boolean',
                            description: 'Force removal with uncommitted changes (default: false)',
                            default: false,
                        },
                        closeTab: {
                            type: 'boolean',
                            description: 'Close iTerm tab (default: true)',
                            default: true,
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'create_pr',
                description: `Create a GitHub pull request from a worktree.

Workflow:
1. Commits uncommitted changes (if autoCommit=true)
2. Pushes branch to origin
3. Creates PR via GitHub CLI

Auto-generates:
- PR title from branch name and ticket
- PR body with changed files list

Requires: GitHub CLI (gh) installed and authenticated`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        worktree: {
                            type: 'string',
                            description: 'Worktree name, ticket ID, or partial match',
                        },
                        title: {
                            type: 'string',
                            description: 'PR title (auto-generated if not provided)',
                        },
                        body: {
                            type: 'string',
                            description: 'PR body (auto-generated if not provided)',
                        },
                        draft: {
                            type: 'boolean',
                            description: 'Create as draft PR (default: false)',
                            default: false,
                        },
                        autoCommit: {
                            type: 'boolean',
                            description: 'Commit uncommitted changes (default: true)',
                            default: true,
                        },
                        commitMessage: {
                            type: 'string',
                            description: 'Commit message if auto-committing',
                        },
                        baseBranch: {
                            type: 'string',
                            description: 'Target branch for PR (defaults to main)',
                        },
                    },
                    required: ['worktree'],
                },
            },
        ],
    };
});
// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'create_worktree': {
                const input = createWorktreeSchema.parse(args);
                const result = await createWorktreeTool(input);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'list_worktrees': {
                const input = listWorktreesSchema.parse(args || {});
                const result = await listWorktreesTool(input);
                return {
                    content: [
                        {
                            type: 'text',
                            text: result.formattedTable + '\n\n' + JSON.stringify(result.summary, null, 2),
                        },
                    ],
                };
            }
            case 'switch_worktree': {
                const input = switchWorktreeSchema.parse(args);
                const result = await switchWorktreeTool(input);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'cleanup_worktree': {
                const input = cleanupWorktreeSchema.parse(args);
                const result = await cleanupWorktreeTool(input);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case 'create_pr': {
                const input = createPrSchema.parse(args);
                const result = await createPrTool(input);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const err = error;
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${err.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Worktree Maestro MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map