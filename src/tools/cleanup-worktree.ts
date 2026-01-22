import { existsSync } from 'fs';
import { z } from 'zod';
import {
  findWorktreeByName,
  removeWorktree as gitRemoveWorktree,
  deleteBranch,
  getChangedFilesCount,
} from '../utils/git.js';
import { releasePort, untrackWorktree, getTrackedWorktreeByName } from '../utils/config.js';
import { findTabByPath, closeItermTab } from '../utils/iterm.js';

export const cleanupWorktreeSchema = z.object({
  name: z.string().describe('Worktree name or partial match (e.g., PROJ-123, user-auth)'),
  deleteBranch: z.boolean().default(true).describe('Delete the associated branch after removing worktree'),
  force: z.boolean().default(false).describe('Force removal even if there are uncommitted changes'),
  closeTab: z.boolean().default(true).describe('Close associated iTerm tab'),
});

export type CleanupWorktreeInput = z.infer<typeof cleanupWorktreeSchema>;

export interface CleanupWorktreeResult {
  success: boolean;
  message: string;
  warnings: string[];
  actions: string[];
}

export async function cleanupWorktreeTool(input: CleanupWorktreeInput): Promise<CleanupWorktreeResult> {
  const warnings: string[] = [];
  const actions: string[] = [];

  try {
    // First try to find in tracked worktrees (supports multi-repo)
    const trackedWorktree = getTrackedWorktreeByName(input.name);

    // Fall back to current repo search
    const gitWorktree = trackedWorktree ? null : findWorktreeByName(input.name);

    const worktree = trackedWorktree
      ? { path: trackedWorktree.path, name: trackedWorktree.name, branch: trackedWorktree.branch, sourceRepo: trackedWorktree.sourceRepo }
      : gitWorktree
        ? { path: gitWorktree.path, name: gitWorktree.name, branch: gitWorktree.branch, sourceRepo: null }
        : null;

    if (!worktree) {
      return {
        success: false,
        message: `Worktree not found: ${input.name}`,
        warnings: [],
        actions: [],
      };
    }

    // Check if path still exists
    if (!existsSync(worktree.path)) {
      // Clean up tracking entry even if path doesn't exist
      untrackWorktree(worktree.path);
      releasePort(worktree.name);
      return {
        success: true,
        message: `Worktree path no longer exists. Cleaned up tracking: ${worktree.name}`,
        warnings: ['Worktree directory was already removed'],
        actions: ['Removed tracking entry', 'Released port assignment'],
      };
    }

    // Check for uncommitted changes
    const changedFiles = getChangedFilesCount(worktree.path);
    if (changedFiles > 0 && !input.force) {
      return {
        success: false,
        message: `Worktree has ${changedFiles} uncommitted changes. Use force=true to remove anyway.`,
        warnings: [`${changedFiles} uncommitted changes will be lost if forced`],
        actions: [],
      };
    }

    if (changedFiles > 0 && input.force) {
      warnings.push(`Discarding ${changedFiles} uncommitted changes`);
    }

    // Close iTerm tab if open
    if (input.closeTab) {
      const tab = findTabByPath(worktree.path);
      if (tab) {
        const closed = closeItermTab(tab.tabId);
        if (closed) {
          actions.push(`Closed iTerm tab: ${tab.name}`);
        } else {
          warnings.push(`Failed to close iTerm tab: ${tab.name}`);
        }
      }
    }

    // Release port assignment
    releasePort(worktree.name);
    actions.push('Released port assignment');

    // Remove worktree (using source repo as cwd)
    gitRemoveWorktree(worktree.path, input.force);
    actions.push(`Removed worktree: ${worktree.path}`);

    // Untrack worktree
    untrackWorktree(worktree.path);
    actions.push('Removed tracking entry');

    // Delete branch if requested
    if (input.deleteBranch && worktree.sourceRepo) {
      try {
        deleteBranch(worktree.branch, input.force, worktree.sourceRepo);
        actions.push(`Deleted branch: ${worktree.branch}`);
      } catch (error) {
        const err = error as Error;
        warnings.push(`Could not delete branch: ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Successfully cleaned up worktree: ${worktree.name}`,
      warnings,
      actions,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      message: `Failed to cleanup worktree: ${err.message}`,
      warnings,
      actions,
    };
  }
}
