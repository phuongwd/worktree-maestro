export declare function isGhInstalled(): boolean;
export declare function isGhAuthenticated(): boolean;
export declare function getGhUsername(): string | null;
export interface CreatePrOptions {
    title: string;
    body: string;
    baseBranch?: string;
    draft?: boolean;
    cwd?: string;
}
export interface PrInfo {
    number: number;
    url: string;
    title: string;
    state: string;
}
export declare function createPullRequest(options: CreatePrOptions): {
    success: boolean;
    pr?: PrInfo;
    error?: string;
};
export declare function getPrForBranch(branch: string, cwd?: string): PrInfo | null;
export declare function listPrs(cwd?: string): PrInfo[];
export declare function generatePrTitle(branch: string, ticket?: string | null): string;
export declare function generatePrBody(changedFiles: string[], ticket?: string | null): string;
//# sourceMappingURL=github.d.ts.map