import { z } from 'zod';
import { existsSync } from 'fs';
import { findWorktreeByName } from '../utils/git.js';
import {
  openNewItermTab,
  openSplitPane,
  switchToTab,
  findTabByPath,
} from '../utils/iterm.js';

export const switchWorktreeSchema = z.object({
  name: z.string().describe('Worktree name, ticket ID, or partial match'),
  openNewTab: z.boolean().default(false).describe('Force open new tab even if one exists'),
  mode: z.enum(['tab', 'split-horizontal', 'split-vertical']).default('tab').describe('How to open: tab, split-horizontal, or split-vertical'),
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

    // Open new tab or split pane
    const tabName = worktree.ticket ? `${worktree.ticket}-${worktree.name.replace(worktree.ticket + '-', '')}` : worktree.name;
    const mode = input.mode || 'tab';

    let tabId: string | null = null;
    if (mode === 'tab') {
      tabId = openNewItermTab(worktree.path, tabName);
    } else {
      const direction = mode === 'split-vertical' ? 'vertical' : 'horizontal';
      tabId = openSplitPane(worktree.path, tabName, direction);
    }

    const modeLabel = mode === 'tab' ? 'tab' : `split pane (${mode.replace('split-', '')})`;

    if (tabId) {
      return {
        success: true,
        message: `Opened new iTerm ${modeLabel}: ${tabName}`,
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
        message: `Failed to open iTerm ${modeLabel}`,
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
