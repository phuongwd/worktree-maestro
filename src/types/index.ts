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

export interface CreateWorktreeOptions {
  ticket?: string;
  name: string;
  baseBranch?: string;
  openInIterm?: boolean;
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
