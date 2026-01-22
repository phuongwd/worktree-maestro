export declare function ensureDirectory(path: string): void;
export declare function copyEnvFiles(sourceDir: string, targetDir: string, envFiles: string[]): string[];
export declare function detectPackageManager(dir: string): 'pnpm' | 'yarn' | 'npm' | 'bun' | null;
export declare function installDependencies(dir: string): {
    success: boolean;
    packageManager: string | null;
    error?: string;
};
export declare function runCommand(command: string, cwd: string): {
    success: boolean;
    output: string;
    error?: string;
};
export declare function getDirectorySize(dir: string): number;
export declare function formatBytes(bytes: number): string;
//# sourceMappingURL=fs.d.ts.map