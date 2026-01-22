import { z } from 'zod';
export declare const switchWorktreeSchema: z.ZodObject<{
    name: z.ZodString;
    openNewTab: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    openNewTab: boolean;
}, {
    name: string;
    openNewTab?: boolean | undefined;
}>;
export type SwitchWorktreeInput = z.infer<typeof switchWorktreeSchema>;
export interface SwitchWorktreeResult {
    success: boolean;
    message: string;
    worktree: {
        name: string;
        path: string;
        branch: string;
    } | null;
    tabAction: 'switched' | 'opened' | 'failed';
}
export declare function switchWorktreeTool(input: SwitchWorktreeInput): Promise<SwitchWorktreeResult>;
//# sourceMappingURL=switch-worktree.d.ts.map