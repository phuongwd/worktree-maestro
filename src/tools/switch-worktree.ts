import { z } from 'zod';
import { existsSync } from 'fs';
import { listWorktrees } from '../utils/git.js';
import {
  openNewItermTab,
  switchToTab,
  findTabByPath,
} from '../utils/iterm.js';

export const switchWorktreeSchema = z.object({
  name: z.string().describe('Worktree name, ticket ID, or partial match'),
  openNewTab: z.boolean().default(false).describe('Open in new tab instead of switching to existing'),
});

export type SwitchWorktreeInput = z.infer<typeof switchWorktreeSchema>;

export interface SwitchWorktreeResult {
  success: boolean;
  message: string;
  worktree: {
    name: string;
    path: string;
    branch: string;
  } | null;
  tabAction: 'switched' | 'opened' | 'failed';
}

function findWorktreeByName(name: string): { path: string; branch: string; name: string; ticket: string | null } | null {
  const worktrees = listWorktrees();

  // Try exact match first
  let match = worktrees.find((wt) => wt.name === name);
  if (match) return match;

  // Try partial match on name
  match = worktrees.find((wt) => wt.name.toLowerCase().includes(name.toLowerCase()));
  if (match) return match;

  // Try partial match on ticket
  match = worktrees.find((wt) => wt.ticket?.toLowerCase().includes(name.toLowerCase()));
  if (match) return match;

  // Try matching by branch name
  match = worktrees.find((wt) => wt.branch.toLowerCase().includes(name.toLowerCase()));
  if (match) return match;

  return null;
}

export async function switchWorktreeTool(input: SwitchWorktreeInput): Promise<SwitchWorktreeResult> {
  try {
    // Find the worktree
    const worktree = findWorktreeByName(input.name);

    if (!worktree) {
      return {
        success: false,
        message: `Worktree not found: ${input.name}`,
        worktree: null,
        tabAction: 'failed',
      };
    }

    // Check if worktree path exists
    if (!existsSync(worktree.path)) {
      return {
        success: false,
        message: `Worktree path does not exist: ${worktree.path}`,
        worktree: null,
        tabAction: 'failed',
      };
    }

    // Check if there's an existing tab for this worktree
    const existingTab = findTabByPath(worktree.path);

    if (existingTab && !input.openNewTab) {
      // Switch to existing tab
      const switched = switchToTab(existingTab.tabId);
      if (switched) {
        return {
          success: true,
          message: `Switched to existing tab: ${existingTab.name}`,
          worktree: {
            name: worktree.name,
            path: worktree.path,
            branch: worktree.branch,
          },
          tabAction: 'switched',
        };
      } else {
        return {
          success: false,
          message: 'Failed to switch to existing tab',
          worktree: {
            name: worktree.name,
            path: worktree.path,
            branch: worktree.branch,
          },
          tabAction: 'failed',
        };
      }
    }

    // Open new tab
    const tabName = worktree.ticket ? `${worktree.ticket}-${worktree.name.replace(worktree.ticket + '-', '')}` : worktree.name;
    const tabId = openNewItermTab(worktree.path, tabName);

    if (tabId) {
      return {
        success: true,
        message: `Opened new iTerm tab: ${tabName}`,
        worktree: {
          name: worktree.name,
          path: worktree.path,
          branch: worktree.branch,
        },
        tabAction: 'opened',
      };
    } else {
      return {
        success: false,
        message: 'Failed to open new iTerm tab',
        worktree: {
          name: worktree.name,
          path: worktree.path,
          branch: worktree.branch,
        },
        tabAction: 'failed',
      };
    }
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      message: `Failed to switch worktree: ${err.message}`,
      worktree: null,
      tabAction: 'failed',
    };
  }
}
