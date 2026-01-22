import { z } from 'zod';
import { listWorktrees as gitListWorktrees } from '../utils/git.js';
import { findTabByPath } from '../utils/iterm.js';
export const listWorktreesSchema = z.object({
    includeMain: z.boolean().default(true).describe('Include main working directory in list'),
    verbose: z.boolean().default(false).describe('Include additional details like port assignments'),
});
function formatWorktreeTable(worktrees, verbose) {
    if (worktrees.length === 0) {
        return 'No worktrees found.';
    }
    const lines = [];
    // Header
    if (verbose) {
        lines.push('| Name | Branch | Status | Changes | Port | iTerm |');
        lines.push('|------|--------|--------|---------|------|-------|');
    }
    else {
        lines.push('| Name | Branch | Status | Changes |');
        lines.push('|------|--------|--------|---------|');
    }
    for (const wt of worktrees) {
        const status = wt.isClean ? 'clean' : 'dirty';
        const changes = wt.changedFiles > 0 ? `${wt.changedFiles} files` : '-';
        const port = wt.port ? `${wt.port}` : '-';
        const iterm = wt.itermTab ? 'open' : '-';
        // Truncate branch name if too long
        const branch = wt.branch.length > 30 ? `${wt.branch.slice(0, 27)}...` : wt.branch;
        const name = wt.name.length > 25 ? `${wt.name.slice(0, 22)}...` : wt.name;
        if (verbose) {
            lines.push(`| ${name} | ${branch} | ${status} | ${changes} | ${port} | ${iterm} |`);
        }
        else {
            lines.push(`| ${name} | ${branch} | ${status} | ${changes} |`);
        }
    }
    return lines.join('\n');
}
export async function listWorktreesTool(input) {
    try {
        let worktrees = gitListWorktrees();
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
        const formattedTable = formatWorktreeTable(worktrees, input.verbose);
        return {
            success: true,
            worktrees,
            summary,
            formattedTable,
        };
    }
    catch (error) {
        const err = error;
        return {
            success: false,
            worktrees: [],
            summary: { total: 0, clean: 0, dirty: 0, withOpenTabs: 0 },
            formattedTable: `Error listing worktrees: ${err.message}`,
        };
    }
}
//# sourceMappingURL=list-worktrees.js.map