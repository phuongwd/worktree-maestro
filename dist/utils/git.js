import { execSync } from 'child_process';
import { statSync } from 'fs';
import { basename } from 'path';
import { getPortForWorktree } from './config.js';
function runGit(args, cwd) {
    try {
        return execSync(`git ${args}`, {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
    }
    catch (error) {
        const err = error;
        throw new Error(err.stderr || err.message);
    }
}
function runGitSafe(args, cwd) {
    try {
        return runGit(args, cwd);
    }
    catch {
        return null;
    }
}
export function getRepoRoot(cwd) {
    return runGit('rev-parse --show-toplevel', cwd);
}
export function getRepoName(cwd) {
    const root = getRepoRoot(cwd);
    return basename(root);
}
export function getCurrentBranch(cwd) {
    return runGit('rev-parse --abbrev-ref HEAD', cwd);
}
export function getDefaultBranch(cwd) {
    const remote = runGitSafe('remote', cwd);
    if (!remote)
        return 'main';
    const defaultRef = runGitSafe('symbolic-ref refs/remotes/origin/HEAD', cwd);
    if (defaultRef) {
        return defaultRef.replace('refs/remotes/origin/', '');
    }
    return 'main';
}
export function branchExists(branch, cwd) {
    const result = runGitSafe(`rev-parse --verify ${branch}`, cwd);
    return result !== null;
}
export function isWorkingTreeClean(cwd) {
    const status = runGit('status --porcelain', cwd);
    return status === '';
}
export function getChangedFilesCount(cwd) {
    const status = runGit('status --porcelain', cwd);
    if (!status)
        return 0;
    return status.split('\n').filter((line) => line.trim()).length;
}
export function getAheadBehind(cwd) {
    const branch = getCurrentBranch(cwd);
    const upstream = runGitSafe(`rev-parse --abbrev-ref ${branch}@{upstream}`, cwd);
    if (!upstream) {
        return { ahead: 0, behind: 0 };
    }
    const result = runGitSafe(`rev-list --left-right --count ${branch}...${upstream}`, cwd);
    if (!result) {
        return { ahead: 0, behind: 0 };
    }
    const [ahead, behind] = result.split('\t').map(Number);
    return { ahead: ahead || 0, behind: behind || 0 };
}
export function listWorktrees(cwd) {
    const output = runGit('worktree list --porcelain', cwd);
    if (!output)
        return [];
    const worktrees = [];
    const entries = output.split('\n\n').filter((e) => e.trim());
    for (const entry of entries) {
        const lines = entry.split('\n');
        const pathLine = lines.find((l) => l.startsWith('worktree '));
        const branchLine = lines.find((l) => l.startsWith('branch '));
        if (!pathLine)
            continue;
        const path = pathLine.replace('worktree ', '');
        const branch = branchLine ? branchLine.replace('branch refs/heads/', '') : 'detached';
        const name = basename(path);
        const ticketMatch = name.match(/^[A-Z]+-\d+|[A-Z]+_\d+/i);
        const ticket = ticketMatch ? ticketMatch[0] : null;
        const isClean = isWorkingTreeClean(path);
        const changedFiles = getChangedFilesCount(path);
        const aheadBehind = getAheadBehind(path);
        const port = getPortForWorktree(name);
        let createdAt = new Date();
        try {
            const stat = statSync(path);
            createdAt = stat.birthtime;
        }
        catch {
            // ignore
        }
        worktrees.push({
            path,
            branch,
            name,
            ticket,
            isClean,
            changedFiles,
            aheadBehind,
            port,
            itermTab: null, // Will be populated by iTerm integration
            createdAt,
        });
    }
    return worktrees;
}
export function createWorktree(targetPath, branch, baseBranch, createNewBranch) {
    if (createNewBranch) {
        runGit(`worktree add -b ${branch} "${targetPath}" ${baseBranch}`);
    }
    else {
        runGit(`worktree add "${targetPath}" ${branch}`);
    }
}
export function removeWorktree(path, force = false) {
    const forceFlag = force ? '--force' : '';
    runGit(`worktree remove ${forceFlag} "${path}"`);
}
export function deleteBranch(branch, force = false, cwd) {
    const flag = force ? '-D' : '-d';
    runGit(`branch ${flag} ${branch}`, cwd);
}
export function commitAll(message, cwd) {
    runGit('add -A', cwd);
    runGit(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);
}
export function push(branch, setUpstream = false, cwd) {
    const upstreamFlag = setUpstream ? '-u origin' : '';
    runGit(`push ${upstreamFlag} ${branch}`, cwd);
}
export function hasRemote(cwd) {
    const remote = runGitSafe('remote', cwd);
    return remote !== null && remote !== '';
}
export function getRemoteUrl(cwd) {
    return runGitSafe('remote get-url origin', cwd);
}
export function parseGitHubUrl(url) {
    const httpsMatch = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (httpsMatch) {
        return { owner: httpsMatch[1], repo: httpsMatch[2].replace('.git', '') };
    }
    return null;
}
//# sourceMappingURL=git.js.map