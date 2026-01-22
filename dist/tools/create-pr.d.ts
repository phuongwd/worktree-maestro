import { z } from 'zod';
import type { PrResult } from '../types/index.js';
export declare const createPrSchema: z.ZodObject<{
    worktree: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    draft: z.ZodDefault<z.ZodBoolean>;
    autoCommit: z.ZodDefault<z.ZodBoolean>;
    commitMessage: z.ZodOptional<z.ZodString>;
    baseBranch: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    worktree: string;
    draft: boolean;
    autoCommit: boolean;
    baseBranch?: string | undefined;
    title?: string | undefined;
    body?: string | undefined;
    commitMessage?: string | undefined;
}, {
    worktree: string;
    baseBranch?: string | undefined;
    title?: string | undefined;
    draft?: boolean | undefined;
    body?: string | undefined;
    autoCommit?: boolean | undefined;
    commitMessage?: string | undefined;
}>;
export type CreatePrInput = z.infer<typeof createPrSchema>;
export declare function createPrTool(input: CreatePrInput): Promise<PrResult>;
//# sourceMappingURL=create-pr.d.ts.map