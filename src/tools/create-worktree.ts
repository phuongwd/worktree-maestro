import { join } from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import {
  getRepoRoot,
  getRepoName,
  getDefaultBranch,
  branchExists,
  createWorktree as gitCreateWorktree,
} from '../utils/git.js';
import { loadConfig, getNextAvailablePort, assignPort, trackWorktree } from '../utils/config.js';
import { ensureDirectory, copyEnvFiles, installDependencies, runCommand } from '../utils/fs.js';
import { openNewItermTab, openSplitPane } from '../utils/iterm.js';
import type { CreateWorktreeResult } from '../types/index.js';

export const createWorktreeSchema = z.object({
  ticket: z.string().optional().describe('Ticket/issue ID (e.g., PROJ-123, GH-456)'),
  name: z.string().describe('Short descriptive name for the worktree (e.g., user-auth, fix-login)'),
  repo: z.string().optional().describe('Path to source repository (defaults to current directory). Use this for global MCP to specify which project.'),
  baseBranch: z.string().optional().describe('Base branch to create from (defaults to main/master)'),
  openInIterm: z.boolean().default(true).describe('Open worktree in iTerm'),
  itermMode: z.enum(['tab', 'split-horizontal', 'split-vertical']).default('tab').describe('How to open in iTerm: tab, split-horizontal, or split-vertical'),
  installDeps: z.boolean().default(true).describe('Run package manager install after creation'),
  copyEnv: z.boolean().default(true).describe('Copy .env files from main repo'),
  startServer: z.boolean().default(false).describe('Start dev server after creation'),
  port: z.number().optional().describe('Specific port for dev server (auto-assigned if not specified)'),
});

export type CreateWorktreeInput = z.infer<typeof createWorktreeSchema>;

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateBranchName(ticket: string | undefined, name: string, prefix: string): string {
  const sanitizedName = sanitizeName(name);

  if (ticket) {
    const sanitizedTicket = ticket.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
    return `${prefix}${sanitizedTicket}-${sanitizedName}`;
  }

  return `${prefix}${sanitizedName}`;
}

function generateWorktreeDirName(repoName: string, ticket: string | undefined, name: string): string {
  const sanitizedName = sanitizeName(name);

  if (ticket) {
    const sanitizedTicket = ticket.toUpperCase().replace(/[^A-Z0-9-]/g, '-');
    return `${repoName}-${sanitizedTicket}-${sanitizedName}`;
  }

  return `${repoName}-${sanitizedName}`;
}

export async function createWorktreeTool(input: CreateWorktreeInput): Promise<CreateWorktreeResult> {
  const config = loadConfig();
  const errors: string[] = [];
  const messages: string[] = [];

  try {
    // Get repo info - use provided repo path or current directory
    const repoRoot = input.repo ? getRepoRoot(input.repo) : getRepoRoot();
    const repoName = getRepoName(repoRoot);
    const defaultBranch = input.baseBranch || getDefaultBranch(repoRoot);

    // Generate names
    const branchName = generateBranchName(input.ticket, input.name, config.branchPrefix);
    const worktreeDirName = generateWorktreeDirName(repoName, input.ticket, input.name);
    const worktreePath = join(config.baseDirectory, worktreeDirName);

    // Check if worktree path already exists
    if (existsSync(worktreePath)) {
      return {
        success: false,
        worktree: {
          path: worktreePath,
          branch: branchName,
          name: worktreeDirName,
          ticket: input.ticket || null,
          isClean: true,
          changedFiles: 0,
          aheadBehind: { ahead: 0, behind: 0 },
          port: null,
          itermTab: null,
          createdAt: new Date(),
          sourceRepo: repoRoot,
          repoName,
        },
        message: `Worktree directory already exists: ${worktreePath}`,
        errors: ['Directory already exists. Use a different name or clean up the existing worktree.'],
      };
    }

    // Check if branch already exists
    const branchAlreadyExists = branchExists(branchName, repoRoot);

    // Ensure base directory exists
    ensureDirectory(config.baseDirectory);

    // Create worktree (run from source repo)
    messages.push(`Creating worktree at ${worktreePath} from ${repoName}`);
    gitCreateWorktree(worktreePath, branchName, defaultBranch, !branchAlreadyExists, repoRoot);
    messages.push(`Created branch: ${branchName}`);

    // Copy env files
    let copiedEnvFiles: string[] = [];
    if (input.copyEnv) {
      copiedEnvFiles = copyEnvFiles(repoRoot, worktreePath, config.envFilesToCopy);
      if (copiedEnvFiles.length > 0) {
        messages.push(`Copied env files: ${copiedEnvFiles.join(', ')}`);
      }
    }

    // Install dependencies
    let packageManager: string | null = null;
    if (input.installDeps) {
      messages.push('Installing dependencies...');
      const installResult = installDependencies(worktreePath);
      packageManager = installResult.packageManager;
      if (installResult.success && packageManager) {
        messages.push(`Dependencies installed via ${packageManager}`);
      } else if (installResult.error) {
        errors.push(`Dependency installation failed: ${installResult.error}`);
      }
    }

    // Assign port
    let assignedPort: number | null = null;
    if (input.startServer || input.port) {
      assignedPort = input.port || getNextAvailablePort();
      assignPort(worktreeDirName, assignedPort);
      messages.push(`Assigned port: ${assignedPort}`);
    }

    // Run post-create commands
    for (const cmd of config.postCreateCommands) {
      const result = runCommand(cmd, worktreePath);
      if (result.success) {
        messages.push(`Ran: ${cmd}`);
      } else {
        errors.push(`Command failed: ${cmd} - ${result.error}`);
      }
    }

    // Open in iTerm
    let itermTabId: string | null = null;
    if (input.openInIterm) {
      const tabName = input.ticket ? `${input.ticket}-${input.name}` : input.name;
      const mode = input.itermMode || 'tab';

      if (mode === 'tab') {
        itermTabId = openNewItermTab(worktreePath, tabName);
      } else {
        const direction = mode === 'split-vertical' ? 'vertical' : 'horizontal';
        itermTabId = openSplitPane(worktreePath, tabName, direction);
      }

      if (itermTabId) {
        const modeLabel = mode === 'tab' ? 'tab' : `split pane (${mode.replace('split-', '')})`;
        messages.push(`Opened iTerm ${modeLabel}: ${tabName}`);
      } else {
        errors.push(`Failed to open iTerm ${mode}`);
      }
    }

    // Start dev server if requested
    if (input.startServer && assignedPort && packageManager) {
      const serverCommands: Record<string, string> = {
        pnpm: `pnpm dev --port ${assignedPort}`,
        yarn: `yarn dev --port ${assignedPort}`,
        npm: `npm run dev -- --port ${assignedPort}`,
        bun: `bun dev --port ${assignedPort}`,
      };

      const serverCmd = serverCommands[packageManager];
      if (serverCmd && itermTabId) {
        // Note: This would need the iTerm runCommandInTab function
        messages.push(`Dev server command ready: ${serverCmd}`);
      }
    }

    // Track the worktree for global access
    trackWorktree({
      name: worktreeDirName,
      path: worktreePath,
      sourceRepo: repoRoot,
      repoName,
      branch: branchName,
      ticket: input.ticket || null,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      worktree: {
        path: worktreePath,
        branch: branchName,
        name: worktreeDirName,
        ticket: input.ticket || null,
        isClean: true,
        changedFiles: 0,
        aheadBehind: { ahead: 0, behind: 0 },
        port: assignedPort,
        itermTab: itermTabId,
        createdAt: new Date(),
        sourceRepo: repoRoot,
        repoName,
      },
      message: messages.join('\n'),
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      worktree: {
        path: '',
        branch: '',
        name: '',
        ticket: null,
        isClean: true,
        changedFiles: 0,
        aheadBehind: { ahead: 0, behind: 0 },
        port: null,
        itermTab: null,
        createdAt: new Date(),
        sourceRepo: null,
        repoName: null,
      },
      message: `Failed to create worktree: ${err.message}`,
      errors: [err.message],
    };
  }
}
