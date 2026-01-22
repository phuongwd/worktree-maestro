import { existsSync } from 'fs';
import { z } from 'zod';
import { listWorktrees as gitListWorktrees, getRepoRoot, getRepoName } from '../utils/git.js';
import { findTabByPath } from '../utils/iterm.js';
import { getUniqueSourceRepos } from '../utils/config.js';
import type { WorktreeInfo } from '../types/index.js';

export const listWorktreesSchema = z.object({
  includeMain: z.boolean().default(true).describe('Include main working directory in list'),
  verbose: z.boolean().default(false).describe('Include additional details like port assignments'),
  repo: z.string().optional().describe('Filter by source repository path. If not specified, shows worktrees from all tracked repos.'),
  allRepos: z.boolean().default(true).describe('Show worktrees from all tracked repositories (global mode)'),
});

export type ListWorktreesInput = z.infer<typeof listWorktreesSchema>;

export interface ListWorktreesResult {
  success: boolean;
  worktrees: WorktreeInfo[];
  summary: {
    total: number;
    clean: number;
    dirty: number;
    withOpenTabs: number;
  };
  formattedTable: string;
}

function formatWorktreeTable(worktrees: WorktreeInfo[], verbose: boolean, showRepo: boolean): string {
  if (worktrees.length === 0) {
    return 'No worktrees found.';
  }

  const lines: string[] = [];

  // Header
  if (verbose && showRepo) {
    lines.push('| Repo | Name | Branch | Status | Changes | Port | iTerm |');
    lines.push('|------|------|--------|--------|---------|------|-------|');
  } else if (verbose) {
    lines.push('| Name | Branch | Status | Changes | Port | iTerm |');
    lines.push('|------|--------|--------|---------|------|-------|');
  } else if (showRepo) {
    lines.push('| Repo | Name | Branch | Status | Changes |');
    lines.push('|------|------|--------|--------|---------|');
  } else {
    lines.push('| Name | Branch | Status | Changes |');
    lines.push('|------|--------|--------|---------|');
  }

  for (const wt of worktrees) {
    const status = wt.isClean ? 'clean' : 'dirty';
    const changes = wt.changedFiles > 0 ? `${wt.changedFiles} files` : '-';
    const port = wt.port ? `${wt.port}` : '-';
    const iterm = wt.itermTab ? 'open' : '-';
    const repo = wt.repoName ? wt.repoName.slice(0, 15) : '-';

    // Truncate branch name if too long
    const branch = wt.branch.length > 30 ? `${wt.branch.slice(0, 27)}...` : wt.branch;
    const name = wt.name.length > 25 ? `${wt.name.slice(0, 22)}...` : wt.name;

    if (verbose && showRepo) {
      lines.push(`| ${repo} | ${name} | ${branch} | ${status} | ${changes} | ${port} | ${iterm} |`);
    } else if (verbose) {
      lines.push(`| ${name} | ${branch} | ${status} | ${changes} | ${port} | ${iterm} |`);
    } else if (showRepo) {
      lines.push(`| ${repo} | ${name} | ${branch} | ${status} | ${changes} |`);
    } else {
      lines.push(`| ${name} | ${branch} | ${status} | ${changes} |`);
    }
  }

  return lines.join('\n');
}

export async function listWorktreesTool(input: ListWorktreesInput): Promise<ListWorktreesResult> {
  try {
    let worktrees: WorktreeInfo[] = [];
    let showRepoColumn = false;

    if (input.allRepos) {
      // Global mode: get worktrees from all tracked repos
      const sourceRepos = getUniqueSourceRepos();
      showRepoColumn = sourceRepos.length > 1;

      if (sourceRepos.length === 0) {
        // Fallback to current directory if no tracked repos
        try {
          const currentRepo = getRepoRoot();
          const repoName = getRepoName(currentRepo);
          const repoWorktrees = gitListWorktrees(currentRepo);
          for (const wt of repoWorktrees) {
            wt.sourceRepo = currentRepo;
            wt.repoName = repoName;
          }
          worktrees = repoWorktrees;
        } catch {
          // Not in a git repo, return empty
        }
      } else {
        // Get worktrees from each tracked source repo
        for (const repoPath of sourceRepos) {
          if (!existsSync(repoPath)) continue;
          try {
            const repoName = getRepoName(repoPath);
            const repoWorktrees = gitListWorktrees(repoPath);
            for (const wt of repoWorktrees) {
              wt.sourceRepo = repoPath;
              wt.repoName = repoName;
            }
            worktrees.push(...repoWorktrees);
          } catch {
            // Skip repos that can't be accessed
          }
        }
      }
    } else if (input.repo) {
      // Filter by specific repo
      const repoPath = getRepoRoot(input.repo);
      const repoName = getRepoName(repoPath);
      worktrees = gitListWorktrees(repoPath);
      for (const wt of worktrees) {
        wt.sourceRepo = repoPath;
        wt.repoName = repoName;
      }
    } else {
      // Current repo only
      try {
        const repoPath = getRepoRoot();
        const repoName = getRepoName(repoPath);
        worktrees = gitListWorktrees(repoPath);
        for (const wt of worktrees) {
          wt.sourceRepo = repoPath;
          wt.repoName = repoName;
        }
      } catch {
        // Not in a git repo
      }
    }

    // Enrich with iTerm tab info
    for (const wt of worktrees) {
      const tab = findTabByPath(wt.path);
      if (tab) {
        wt.itermTab = tab.tabId;
      }
    }

    // Filter main if requested
    if (!input.includeMain) {
      worktrees = worktrees.filter((wt) => !wt.path.endsWith(wt.branch) || wt.branch !== 'main');
    }

    // Sort by creation date (newest first)
    worktrees.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const summary = {
      total: worktrees.length,
      clean: worktrees.filter((wt) => wt.isClean).length,
      dirty: worktrees.filter((wt) => !wt.isClean).length,
      withOpenTabs: worktrees.filter((wt) => wt.itermTab).length,
    };

    const formattedTable = formatWorktreeTable(worktrees, input.verbose, showRepoColumn);

    return {
      success: true,
      worktrees,
      summary,
      formattedTable,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      worktrees: [],
      summary: { total: 0, clean: 0, dirty: 0, withOpenTabs: 0 },
      formattedTable: `Error listing worktrees: ${err.message}`,
    };
  }
}
