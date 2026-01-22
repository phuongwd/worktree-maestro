import { spawnSync } from 'child_process';
import type { ItermTabInfo } from '../types/index.js';

function runAppleScript(script: string): string {
  try {
    // Use spawn with stdin to avoid shell escaping issues
    const result = spawnSync('osascript', ['-'], {
      input: script,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(result.stderr || 'AppleScript execution failed');
    }

    return result.stdout.trim();
  } catch (error) {
    const err = error as { stderr?: string; message: string };
    throw new Error(err.stderr || err.message);
  }
}

function runAppleScriptSafe(script: string): string | null {
  try {
    return runAppleScript(script);
  } catch {
    return null;
  }
}

export function isItermRunning(): boolean {
  const result = runAppleScriptSafe(`
    tell application "System Events"
      return (name of processes) contains "iTerm2"
    end tell
  `);
  return result === 'true';
}

export function openNewItermTab(path: string, tabName: string): string | null {
  const script = `
    tell application "iTerm2"
      activate
      tell current window
        set newTab to (create tab with default profile)
        tell current session
          set name to "${tabName}"
          write text "cd '${path}'"
        end tell
      end tell
    end tell
    return "success"
  `;

  return runAppleScriptSafe(script);
}

export function openNewItermWindow(path: string, tabName: string): string | null {
  const script = `
    tell application "iTerm2"
      activate
      set newWindow to (create window with default profile)
      tell current session of current window
        set name to "${tabName}"
        write text "cd '${path}'"
      end tell
      return id of current window
    end tell
  `;

  return runAppleScriptSafe(script);
}

export function runCommandInTab(tabId: string, command: string): boolean {
  const script = `
    tell application "iTerm2"
      repeat with w in windows
        repeat with t in tabs of w
          if (id of t) = ${tabId} then
            tell current session of t
              write text "${command.replace(/"/g, '\\"')}"
            end tell
            return true
          end if
        end repeat
      end repeat
      return false
    end tell
  `;

  const result = runAppleScriptSafe(script);
  return result === 'true';
}

export function closeItermTab(tabId: string): boolean {
  const script = `
    tell application "iTerm2"
      repeat with w in windows
        repeat with t in tabs of w
          if (id of t) = ${tabId} then
            close t
            return true
          end if
        end repeat
      end repeat
      return false
    end tell
  `;

  const result = runAppleScriptSafe(script);
  return result === 'true';
}

export function getItermTabs(): ItermTabInfo[] {
  const script = `
    tell application "iTerm2"
      set tabList to {}
      repeat with w in windows
        set windowId to id of w
        repeat with t in tabs of w
          set tabId to id of t
          set tabName to name of current session of t
          set tabPath to ""
          try
            tell current session of t
              set tabPath to variable named "session.path"
            end tell
          end try
          set isActive to (current tab of w) = t
          set end of tabList to (windowId as string) & "|" & (tabId as string) & "|" & tabName & "|" & tabPath & "|" & (isActive as string)
        end repeat
      end repeat
      return tabList
    end tell
  `;

  const result = runAppleScriptSafe(script);
  if (!result) return [];

  const tabs: ItermTabInfo[] = [];
  const entries = result.split(', ');

  for (const entry of entries) {
    const parts = entry.split('|');
    if (parts.length >= 5) {
      tabs.push({
        windowId: parts[0],
        tabId: parts[1],
        name: parts[2],
        currentPath: parts[3],
        isActive: parts[4] === 'true',
      });
    }
  }

  return tabs;
}

export function switchToTab(tabId: string): boolean {
  const script = `
    tell application "iTerm2"
      activate
      repeat with w in windows
        repeat with t in tabs of w
          if (id of t) = ${tabId} then
            select t
            set frontmost of w to true
            return true
          end if
        end repeat
      end repeat
      return false
    end tell
  `;

  const result = runAppleScriptSafe(script);
  return result === 'true';
}

export function findTabByPath(path: string): ItermTabInfo | null {
  const tabs = getItermTabs();
  return tabs.find((t) => t.currentPath === path || t.currentPath.endsWith(path)) || null;
}

export function findTabByName(name: string): ItermTabInfo | null {
  const tabs = getItermTabs();
  return tabs.find((t) => t.name.includes(name)) || null;
}

export function setTabName(tabId: string, name: string): boolean {
  const script = `
    tell application "iTerm2"
      repeat with w in windows
        repeat with t in tabs of w
          if (id of t) = ${tabId} then
            tell current session of t
              set name to "${name}"
            end tell
            return true
          end if
        end repeat
      end repeat
      return false
    end tell
  `;

  const result = runAppleScriptSafe(script);
  return result === 'true';
}
