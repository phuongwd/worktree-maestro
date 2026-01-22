import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { WorktreeConfig, PortAssignment, TrackedWorktree } from '../types/index.js';

const CONFIG_DIR = join(homedir(), '.worktree-maestro');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const STATE_FILE = join(CONFIG_DIR, 'state.json');

const DEFAULT_CONFIG: WorktreeConfig = {
  baseDirectory: join(homedir(), 'worktrees'),
  portRangeStart: 3001,
  portRangeEnd: 3099,
  envFilesToCopy: ['.env', '.env.local', '.env.development', '.env.development.local'],
  postCreateCommands: [],
  defaultBaseBranch: 'main',
  branchPrefix: 'feature/',
};

interface State {
  portAssignments: PortAssignment[];
  lastUsedPort: number;
  trackedWorktrees: TrackedWorktree[];
}

const DEFAULT_STATE: State = {
  portAssignments: [],
  lastUsedPort: 3000,
  trackedWorktrees: [],
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): WorktreeConfig {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: WorktreeConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadState(): State {
  ensureConfigDir();

  if (!existsSync(STATE_FILE)) {
    saveState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }

  try {
    const content = readFileSync(STATE_FILE, 'utf-8');
    return { ...DEFAULT_STATE, ...JSON.parse(content) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: State): void {
  ensureConfigDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function getNextAvailablePort(): number {
  const config = loadConfig();
  const state = loadState();

  const usedPorts = new Set(state.portAssignments.map((p) => p.port));

  for (let port = config.portRangeStart; port <= config.portRangeEnd; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }

  throw new Error(`No available ports in range ${config.portRangeStart}-${config.portRangeEnd}`);
}

export function assignPort(worktree: string, port: number): void {
  const state = loadState();
  state.portAssignments = state.portAssignments.filter((p) => p.worktree !== worktree);
  state.portAssignments.push({ port, worktree });
  state.lastUsedPort = port;
  saveState(state);
}

export function releasePort(worktree: string): void {
  const state = loadState();
  state.portAssignments = state.portAssignments.filter((p) => p.worktree !== worktree);
  saveState(state);
}

export function getPortForWorktree(worktree: string): number | null {
  const state = loadState();
  const assignment = state.portAssignments.find((p) => p.worktree === worktree);
  return assignment?.port ?? null;
}

export function trackWorktree(worktree: TrackedWorktree): void {
  const state = loadState();
  state.trackedWorktrees = state.trackedWorktrees.filter((w) => w.path !== worktree.path);
  state.trackedWorktrees.push(worktree);
  saveState(state);
}

export function untrackWorktree(path: string): void {
  const state = loadState();
  state.trackedWorktrees = state.trackedWorktrees.filter((w) => w.path !== path);
  saveState(state);
}

export function getTrackedWorktrees(): TrackedWorktree[] {
  const state = loadState();
  return state.trackedWorktrees || [];
}

export function getTrackedWorktreeByName(searchTerm: string): TrackedWorktree | null {
  const worktrees = getTrackedWorktrees();
  const lowerSearch = searchTerm.toLowerCase();

  // Exact name match
  let match = worktrees.find((w) => w.name === searchTerm);
  if (match) return match;

  // Partial name match
  match = worktrees.find((w) => w.name.toLowerCase().includes(lowerSearch));
  if (match) return match;

  // Ticket match
  match = worktrees.find((w) => w.ticket?.toLowerCase().includes(lowerSearch));
  if (match) return match;

  // Branch match
  match = worktrees.find((w) => w.branch.toLowerCase().includes(lowerSearch));
  if (match) return match;

  return null;
}

export function getUniqueSourceRepos(): string[] {
  const worktrees = getTrackedWorktrees();
  const repos = new Set(worktrees.map((w) => w.sourceRepo));
  return Array.from(repos);
}
