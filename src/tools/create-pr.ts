import { z } from 'zod';
import { execSync } from 'child_process';
import {
  findWorktreeByName,
  getChangedFilesCount,
  commitAll,
  push,
  hasRemote,
  getDefaultBranch,
} from '../utils/git.js';
import {
  isGhInstalled,
  isGhAuthenticated,
  createPullRequest,
  getPrForBranch,
  generatePrTitle,
  generatePrBody,
} from '../utils/github.js';
import type { PrResult } from '../types/index.js';

export const createPrSchema = z.object({
  worktree: z.string().describe('Worktree name, ticket ID, or partial match'),
  title: z.string().optional().describe('PR title (auto-generated if not provided)'),
  body: z.string().optional().describe('PR body (auto-generated if not provided)'),
  draft: z.boolean().default(false).describe('Create as draft PR'),
  autoCommit: z.boolean().default(true).describe('Automatically commit uncommitted changes'),
  commitMessage: z.string().optional().describe('Commit message if auto-committing'),
  baseBranch: z.string().optional().describe('Target branch for PR (defaults to main/master)'),
});

export type CreatePrInput = z.infer<typeof createPrSchema>;

function getAllChangedFiles(cwd: string): string[] {
  try {
    const output = execSync('git diff --name-only HEAD~1..HEAD 2>/dev/null || git diff --name-only HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (!output) return [];
    return output.split('\n').filter((f) => f.trim());
  } catch {
    return [];
  }
}

export async function createPrTool(input: CreatePrInput): Promise<PrResult> {
  try {
    // Check gh CLI
    if (!isGhInstalled()) {
      return {
        success: false,
        message: 'GitHub CLI (gh) is not installed. Please install it: brew install gh',
      };
    }

    if (!isGhAuthenticated()) {
      return {
        success: false,
        message: 'GitHub CLI is not authenticated. Please run: gh auth login',
      };
    }

    // Find worktree
    const worktree = findWorktreeByName(input.worktree);

    if (!worktree) {
      return {
        success: false,
        message: `Worktree not found: ${input.worktree}`,
      };
    }

    // Check for remote
    if (!hasRemote(worktree.path)) {
      return {
        success: false,
        message: 'No remote configured. Please add a remote first.',
      };
    }

    // Check if PR already exists for this branch
    const existingPr = getPrForBranch(worktree.branch, worktree.path);
    if (existingPr) {
      return {
        success: true,
        prUrl: existingPr.url,
        prNumber: existingPr.number,
        message: `PR already exists: ${existingPr.url}`,
      };
    }

    // Handle uncommitted changes
    const changedCount = getChangedFilesCount(worktree.path);
    if (changedCount > 0) {
      if (!input.autoCommit) {
        return {
          success: false,
          message: `Worktree has ${changedCount} uncommitted changes. Set autoCommit=true or commit manually.`,
        };
      }

      // Generate commit message
      const commitMsg = input.commitMessage || generateCommitMessage(worktree.branch, worktree.ticket);

      try {
        commitAll(commitMsg, worktree.path);
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          message: `Failed to commit changes: ${err.message}`,
        };
      }
    }

    // Push branch
    try {
      push(worktree.branch, true, worktree.path);
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: `Failed to push branch: ${err.message}`,
      };
    }

    // Generate PR title and body
    const prTitle = input.title || generatePrTitle(worktree.branch, worktree.ticket);
    const changedFiles = getAllChangedFiles(worktree.path);
    const prBody = input.body || generatePrBody(changedFiles, worktree.ticket);
    const baseBranch = input.baseBranch || getDefaultBranch(worktree.path);

    // Create PR
    const result = createPullRequest({
      title: prTitle,
      body: prBody,
      baseBranch,
      draft: input.draft,
      cwd: worktree.path,
    });

    if (result.success && result.pr) {
      return {
        success: true,
        prUrl: result.pr.url,
        prNumber: result.pr.number,
        message: `Created PR #${result.pr.number}: ${result.pr.url}`,
      };
    } else {
      return {
        success: false,
        message: `Failed to create PR: ${result.error}`,
      };
    }
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      message: `Failed to create PR: ${err.message}`,
    };
  }
}

function generateCommitMessage(branch: string, ticket: string | null): string {
  // Extract type from branch name
  const typeMatch = branch.match(/^(feature|fix|hotfix|bugfix|chore|refactor|docs)\//);
  const type = typeMatch ? typeMatch[1].replace('hotfix', 'fix').replace('bugfix', 'fix') : 'feat';

  // Extract description
  let description = branch
    .replace(/^(feature|fix|hotfix|bugfix|chore|refactor|docs)\//, '')
    .replace(/^[A-Z]+-\d+-?/i, '')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .trim();

  // Capitalize first letter
  description = description.charAt(0).toLowerCase() + description.slice(1);

  if (ticket) {
    return `${type}: ${description}\n\n${ticket.toUpperCase()}`;
  }

  return `${type}: ${description}`;
}
