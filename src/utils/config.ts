import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { WorktreeConfig, PortAssignment } from '../types/index.js';

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
}

const DEFAULT_STATE: State = {
  portAssignments: [],
  lastUsedPort: 3000,
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
