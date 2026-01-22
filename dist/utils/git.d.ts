import type { WorktreeInfo } from '../types/index.js';
export declare function getRepoRoot(cwd?: string): string;
export declare function getRepoName(cwd?: string): string;
export declare function getCurrentBranch(cwd?: string): string;
export declare function getDefaultBranch(cwd?: string): string;
export declare function branchExists(branch: string, cwd?: string): boolean;
export declare function isWorkingTreeClean(cwd?: string): boolean;
export declare function getChangedFilesCount(cwd?: string): number;
export declare function getAheadBehind(cwd?: string): {
    ahead: number;
    behind: number;
};
export declare function listWorktrees(cwd?: string): WorktreeInfo[];
export declare function createWorktree(targetPath: string, branch: string, baseBranch: string, createNewBranch: boolean): void;
export declare function removeWorktree(path: string, force?: boolean): void;
export declare function deleteBranch(branch: string, force?: boolean, cwd?: string): void;
export declare function commitAll(message: string, cwd?: string): void;
export declare function push(branch: string, setUpstream?: boolean, cwd?: string): void;
export declare function hasRemote(cwd?: string): boolean;
export declare function getRemoteUrl(cwd?: string): string | null;
export declare function parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
} | null;
//# sourceMappingURL=git.d.ts.map