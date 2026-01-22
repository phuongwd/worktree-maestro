import { z } from 'zod';
export declare const cleanupWorktreeSchema: z.ZodObject<{
    name: z.ZodString;
    deleteBranch: z.ZodDefault<z.ZodBoolean>;
    force: z.ZodDefault<z.ZodBoolean>;
    closeTab: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    deleteBranch: boolean;
    force: boolean;
    closeTab: boolean;
}, {
    name: string;
    deleteBranch?: boolean | undefined;
    force?: boolean | undefined;
    closeTab?: boolean | undefined;
}>;
export type CleanupWorktreeInput = z.infer<typeof cleanupWorktreeSchema>;
export interface CleanupWorktreeResult {
    success: boolean;
    message: string;
    warnings: string[];
    actions: string[];
}
export declare function cleanupWorktreeTool(input: CleanupWorktreeInput): Promise<CleanupWorktreeResult>;
//# sourceMappingURL=cleanup-worktree.d.ts.map