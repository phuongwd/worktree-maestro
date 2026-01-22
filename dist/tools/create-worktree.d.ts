import { z } from 'zod';
import type { CreateWorktreeResult } from '../types/index.js';
export declare const createWorktreeSchema: z.ZodObject<{
    ticket: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    baseBranch: z.ZodOptional<z.ZodString>;
    openInIterm: z.ZodDefault<z.ZodBoolean>;
    installDeps: z.ZodDefault<z.ZodBoolean>;
    copyEnv: z.ZodDefault<z.ZodBoolean>;
    startServer: z.ZodDefault<z.ZodBoolean>;
    port: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    openInIterm: boolean;
    installDeps: boolean;
    copyEnv: boolean;
    startServer: boolean;
    ticket?: string | undefined;
    baseBranch?: string | undefined;
    port?: number | undefined;
}, {
    name: string;
    ticket?: string | undefined;
    baseBranch?: string | undefined;
    openInIterm?: boolean | undefined;
    installDeps?: boolean | undefined;
    copyEnv?: boolean | undefined;
    startServer?: boolean | undefined;
    port?: number | undefined;
}>;
export type CreateWorktreeInput = z.infer<typeof createWorktreeSchema>;
export declare function createWorktreeTool(input: CreateWorktreeInput): Promise<CreateWorktreeResult>;
//# sourceMappingURL=create-worktree.d.ts.map