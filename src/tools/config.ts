import { z } from 'zod';
import { loadConfig, saveConfig } from '../utils/config.js';
import type { WorktreeConfig } from '../types/index.js';

export const getConfigSchema = z.object({});

export const setConfigSchema = z.object({
  baseDirectory: z
    .string()
    .optional()
    .describe('Directory where worktrees are created (default: ~/worktrees)'),
  portRangeStart: z
    .number()
    .optional()
    .describe('Start of port range for dev servers (default: 3001)'),
  portRangeEnd: z
    .number()
    .optional()
    .describe('End of port range for dev servers (default: 3099)'),
  envFilesToCopy: z
    .array(z.string())
    .optional()
    .describe('List of env files to copy when creating worktree'),
  postCreateCommands: z
    .array(z.string())
    .optional()
    .describe('Commands to run after creating worktree'),
  defaultBaseBranch: z
    .string()
    .optional()
    .describe('Default base branch for new worktrees (default: main)'),
  branchPrefix: z
    .string()
    .optional()
    .describe('Prefix for new branch names (default: feature/)'),
});

export type GetConfigInput = z.infer<typeof getConfigSchema>;
export type SetConfigInput = z.infer<typeof setConfigSchema>;

export interface GetConfigResult {
  success: boolean;
  config: WorktreeConfig;
  configPath: string;
  formatted: string;
}

export interface SetConfigResult {
  success: boolean;
  message: string;
  updatedFields: string[];
  config: WorktreeConfig;
}

function formatConfig(config: WorktreeConfig): string {
  const lines: string[] = [
    '## Worktree Maestro Configuration',
    '',
    '| Setting | Value |',
    '|---------|-------|',
    `| Base Directory | \`${config.baseDirectory}\` |`,
    `| Port Range | ${config.portRangeStart} - ${config.portRangeEnd} |`,
    `| Default Base Branch | ${config.defaultBaseBranch} |`,
    `| Branch Prefix | ${config.branchPrefix} |`,
    '',
    '**Env Files to Copy:**',
    ...config.envFilesToCopy.map((f) => `- ${f}`),
    '',
  ];

  if (config.postCreateCommands.length > 0) {
    lines.push('**Post-Create Commands:**');
    lines.push(...config.postCreateCommands.map((c) => `- \`${c}\``));
  } else {
    lines.push('**Post-Create Commands:** None');
  }

  return lines.join('\n');
}

export async function getConfigTool(): Promise<GetConfigResult> {
  const config = loadConfig();
  const configPath = `${process.env.HOME}/.worktree-maestro/config.json`;

  return {
    success: true,
    config,
    configPath,
    formatted: formatConfig(config),
  };
}

export async function setConfigTool(input: SetConfigInput): Promise<SetConfigResult> {
  const currentConfig = loadConfig();
  const updatedFields: string[] = [];

  const newConfig: WorktreeConfig = { ...currentConfig };

  if (input.baseDirectory !== undefined) {
    newConfig.baseDirectory = expandPath(input.baseDirectory);
    updatedFields.push('baseDirectory');
  }

  if (input.portRangeStart !== undefined) {
    if (input.portRangeStart < 1024 || input.portRangeStart > 65535) {
      return {
        success: false,
        message: 'portRangeStart must be between 1024 and 65535',
        updatedFields: [],
        config: currentConfig,
      };
    }
    newConfig.portRangeStart = input.portRangeStart;
    updatedFields.push('portRangeStart');
  }

  if (input.portRangeEnd !== undefined) {
    if (input.portRangeEnd < 1024 || input.portRangeEnd > 65535) {
      return {
        success: false,
        message: 'portRangeEnd must be between 1024 and 65535',
        updatedFields: [],
        config: currentConfig,
      };
    }
    newConfig.portRangeEnd = input.portRangeEnd;
    updatedFields.push('portRangeEnd');
  }

  if (newConfig.portRangeStart >= newConfig.portRangeEnd) {
    return {
      success: false,
      message: 'portRangeStart must be less than portRangeEnd',
      updatedFields: [],
      config: currentConfig,
    };
  }

  if (input.envFilesToCopy !== undefined) {
    newConfig.envFilesToCopy = input.envFilesToCopy;
    updatedFields.push('envFilesToCopy');
  }

  if (input.postCreateCommands !== undefined) {
    newConfig.postCreateCommands = input.postCreateCommands;
    updatedFields.push('postCreateCommands');
  }

  if (input.defaultBaseBranch !== undefined) {
    newConfig.defaultBaseBranch = input.defaultBaseBranch;
    updatedFields.push('defaultBaseBranch');
  }

  if (input.branchPrefix !== undefined) {
    newConfig.branchPrefix = input.branchPrefix;
    updatedFields.push('branchPrefix');
  }

  if (updatedFields.length === 0) {
    return {
      success: true,
      message: 'No changes made',
      updatedFields: [],
      config: currentConfig,
    };
  }

  saveConfig(newConfig);

  return {
    success: true,
    message: `Updated ${updatedFields.length} setting(s): ${updatedFields.join(', ')}`,
    updatedFields,
    config: newConfig,
  };
}

function expandPath(path: string): string {
  if (path.startsWith('~/')) {
    return path.replace('~', process.env.HOME || '');
  }
  return path;
}
