import type { WorktreeConfig, PortAssignment } from '../types/index.js';
interface State {
    portAssignments: PortAssignment[];
    lastUsedPort: number;
}
export declare function loadConfig(): WorktreeConfig;
export declare function saveConfig(config: WorktreeConfig): void;
export declare function loadState(): State;
export declare function saveState(state: State): void;
export declare function getNextAvailablePort(): number;
export declare function assignPort(worktree: string, port: number): void;
export declare function releasePort(worktree: string): void;
export declare function getPortForWorktree(worktree: string): number | null;
export {};
//# sourceMappingURL=config.d.ts.map