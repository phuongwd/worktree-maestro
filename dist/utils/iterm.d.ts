import type { ItermTabInfo } from '../types/index.js';
export declare function isItermRunning(): boolean;
export declare function openNewItermTab(path: string, tabName: string): string | null;
export declare function openNewItermWindow(path: string, tabName: string): string | null;
export declare function runCommandInTab(tabId: string, command: string): boolean;
export declare function closeItermTab(tabId: string): boolean;
export declare function getItermTabs(): ItermTabInfo[];
export declare function switchToTab(tabId: string): boolean;
export declare function findTabByPath(path: string): ItermTabInfo | null;
export declare function findTabByName(name: string): ItermTabInfo | null;
export declare function setTabName(tabId: string, name: string): boolean;
//# sourceMappingURL=iterm.d.ts.map