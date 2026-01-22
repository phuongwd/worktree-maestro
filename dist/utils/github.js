import { execSync } from 'child_process';
function runGh(args, cwd) {
    try {
        const output = execSync(`gh ${args}`, {
            cwd,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
        return { success: true, output };
    }
    catch (error) {
        const err = error;
        return { success: false, output: err.stdout || '', error: err.stderr || err.message };
    }
}
export function isGhInstalled() {
    try {
        execSync('which gh', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    }
    catch {
        return false;
    }
}
export function isGhAuthenticated() {
    const result = runGh('auth status');
    return result.success;
}
export function getGhUsername() {
    const result = runGh('api user --jq .login');
    return result.success ? result.output : null;
}
export function createPullRequest(options) {
    const args = [
        'pr create',
        `--title "${options.title.replace(/"/g, '\\"')}"`,
        `--body "${options.body.replace(/"/g, '\\"')}"`,
    ];
    if (options.baseBranch) {
        args.push(`--base ${options.baseBranch}`);
    }
    if (options.draft) {
        args.push('--draft');
    }
    const result = runGh(args.join(' '), options.cwd);
    if (!result.success) {
        return { success: false, error: result.error };
    }
    // Parse the PR URL from output
    const urlMatch = result.output.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/);
    const numberMatch = result.output.match(/\/pull\/(\d+)/);
    if (urlMatch && numberMatch) {
        return {
            success: true,
            pr: {
                number: parseInt(numberMatch[1], 10),
                url: urlMatch[0],
                title: options.title,
                state: options.draft ? 'draft' : 'open',
            },
        };
    }
    return { success: true, pr: { number: 0, url: result.output, title: options.title, state: 'open' } };
}
export function getPrForBranch(branch, cwd) {
    const result = runGh(`pr view ${branch} --json number,url,title,state`, cwd);
    if (!result.success) {
        return null;
    }
    try {
        return JSON.parse(result.output);
    }
    catch {
        return null;
    }
}
export function listPrs(cwd) {
    const result = runGh('pr list --json number,url,title,state', cwd);
    if (!result.success) {
        return [];
    }
    try {
        return JSON.parse(result.output);
    }
    catch {
        return [];
    }
}
export function generatePrTitle(branch, ticket) {
    // Extract meaningful name from branch
    let name = branch
        .replace(/^(feature|fix|hotfix|bugfix|chore|refactor)\//, '')
        .replace(/^[A-Z]+-\d+-?/i, '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .trim();
    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (ticket) {
        return `${ticket.toUpperCase()}: ${name}`;
    }
    return name;
}
export function generatePrBody(changedFiles, ticket) {
    const lines = ['## Summary', '', '<!-- Describe your changes here -->', ''];
    if (ticket) {
        lines.push(`## Ticket`, '', `- ${ticket.toUpperCase()}`, '');
    }
    if (changedFiles.length > 0) {
        lines.push('## Changed Files', '');
        for (const file of changedFiles.slice(0, 20)) {
            lines.push(`- \`${file}\``);
        }
        if (changedFiles.length > 20) {
            lines.push(`- ... and ${changedFiles.length - 20} more files`);
        }
        lines.push('');
    }
    lines.push('## Test Plan', '', '- [ ] Tested locally', '- [ ] Tests pass', '');
    return lines.join('\n');
}
//# sourceMappingURL=github.js.map