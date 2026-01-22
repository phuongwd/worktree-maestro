import { execSync } from 'child_process';
function runAppleScript(script) {
    try {
        return execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
    }
    catch (error) {
        const err = error;
        throw new Error(err.stderr || err.message);
    }
}
function runAppleScriptSafe(script) {
    try {
        return runAppleScript(script);
    }
    catch {
        return null;
    }
}
export function isItermRunning() {
    const result = runAppleScriptSafe(`
    tell application "System Events"
      return (name of processes) contains "iTerm2"
    end tell
  `);
    return result === 'true';
}
export function openNewItermTab(path, tabName) {
    const script = `
    tell application "iTerm2"
      activate
      tell current window
        create tab with default profile
        tell current session
          set name to "${tabName}"
          write text "cd \\"${path}\\""
        end tell
        return id of current tab
      end tell
    end tell
  `;
    return runAppleScriptSafe(script);
}
export function openNewItermWindow(path, tabName) {
    const script = `
    tell application "iTerm2"
      activate
      set newWindow to (create window with default profile)
      tell current session of current window
        set name to "${tabName}"
        write text "cd \\"${path}\\""
      end tell
      return id of current window
    end tell
  `;
    return runAppleScriptSafe(script);
}
export function runCommandInTab(tabId, command) {
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
export function closeItermTab(tabId) {
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
export function getItermTabs() {
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
    if (!result)
        return [];
    const tabs = [];
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
export function switchToTab(tabId) {
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
export function findTabByPath(path) {
    const tabs = getItermTabs();
    return tabs.find((t) => t.currentPath === path || t.currentPath.endsWith(path)) || null;
}
export function findTabByName(name) {
    const tabs = getItermTabs();
    return tabs.find((t) => t.name.includes(name)) || null;
}
export function setTabName(tabId, name) {
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
//# sourceMappingURL=iterm.js.map