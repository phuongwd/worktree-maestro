export interface WorktreeInfo {
  path: string;
  branch: string;
  name: string;
  ticket: string | null;
  isClean: boolean;
  changedFiles: number;
  aheadBehind: {
    ahead: number;
    behind: number;
  };
  port: number | null;
  itermTab: string | null;
  createdAt: Date;
  sourceRepo: string | null; // Path to the source repository
  repoName: string | null; // Name of the source repository
}

export interface TrackedWorktree {
  name: string;
  path: string;
  sourceRepo: string;
  repoName: string;
  branch: string;
  ticket: string | null;
  createdAt: string; // ISO date string for serialization
}

export interface WorktreeConfig {
  baseDirectory: string;
  portRangeStart: number;
  portRangeEnd: number;
  envFilesToCopy: string[];
  postCreateCommands: string[];
  defaultBaseBranch: string;
  branchPrefix: string;
}

export type ItermOpenMode = 'tab' | 'split-horizontal' | 'split-vertical';

export interface CreateWorktreeOptions {
  ticket?: string;
  name: string;
  baseBranch?: string;
  openInIterm?: boolean;
  itermMode?: ItermOpenMode;
  installDeps?: boolean;
  copyEnv?: boolean;
  startServer?: boolean;
  port?: number;
}

export interface CreateWorktreeResult {
  success: boolean;
  worktree: WorktreeInfo;
  message: string;
  errors?: string[];
}

export interface CleanupWorktreeOptions {
  name: string;
  deleteBranch?: boolean;
  force?: boolean;
}

export interface PrOptions {
  worktree: string;
  title?: string;
  body?: string;
  draft?: boolean;
  autoCommit?: boolean;
  commitMessage?: string;
}

export interface PrResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  message: string;
}

export interface ItermTabInfo {
  tabId: string;
  windowId: string;
  name: string;
  currentPath: string;
  isActive: boolean;
}

export interface PortAssignment {
  port: number;
  worktree: string;
  pid?: number;
}
