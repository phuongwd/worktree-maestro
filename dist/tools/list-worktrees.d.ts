import { z } from 'zod';
import type { WorktreeInfo } from '../types/index.js';
export declare const listWorktreesSchema: z.ZodObject<{
    includeMain: z.ZodDefault<z.ZodBoolean>;
    verbose: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    includeMain: boolean;
    verbose: boolean;
}, {
    includeMain?: boolean | undefined;
    verbose?: boolean | undefined;
}>;
export type ListWorktreesInput = z.infer<typeof listWorktreesSchema>;
export interface ListWorktreesResult {
    success: boolean;
    worktrees: WorktreeInfo[];
    summary: {
        total: number;
        clean: number;
        dirty: number;
        withOpenTabs: number;
    };
    formattedTable: string;
}
export declare function listWorktreesTool(input: ListWorktreesInput): Promise<ListWorktreesResult>;
//# sourceMappingURL=list-worktrees.d.ts.map