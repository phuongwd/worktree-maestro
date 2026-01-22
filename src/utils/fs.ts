import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export function ensureDirectory(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function copyEnvFiles(sourceDir: string, targetDir: string, envFiles: string[]): string[] {
  const copiedFiles: string[] = [];

  for (const envFile of envFiles) {
    const sourcePath = join(sourceDir, envFile);
    const targetPath = join(targetDir, envFile);

    if (existsSync(sourcePath)) {
      copyFileSync(sourcePath, targetPath);
      copiedFiles.push(envFile);
    }
  }

  return copiedFiles;
}

export function detectPackageManager(dir: string): 'pnpm' | 'yarn' | 'npm' | 'bun' | null {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(dir, 'bun.lockb'))) return 'bun';
  if (existsSync(join(dir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(dir, 'package-lock.json'))) return 'npm';
  if (existsSync(join(dir, 'package.json'))) return 'npm';
  return null;
}

export function installDependencies(dir: string): { success: boolean; packageManager: string | null; error?: string } {
  const packageManager = detectPackageManager(dir);

  if (!packageManager) {
    return { success: true, packageManager: null };
  }

  const commands: Record<string, string> = {
    pnpm: 'pnpm install',
    yarn: 'yarn install',
    npm: 'npm install',
    bun: 'bun install',
  };

  try {
    execSync(commands[packageManager], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, packageManager };
  } catch (error) {
    const err = error as { stderr?: string; message: string };
    return { success: false, packageManager, error: err.stderr || err.message };
  }
}

export function runCommand(command: string, cwd: string): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output };
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message: string };
    return { success: false, output: err.stdout || '', error: err.stderr || err.message };
  }
}

export function getDirectorySize(dir: string): number {
  let size = 0;

  try {
    const files = readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        if (file.name !== 'node_modules' && file.name !== '.git') {
          size += getDirectorySize(path);
        }
      } else {
        size += statSync(path).size;
      }
    }
  } catch {
    // ignore errors
  }

  return size;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
