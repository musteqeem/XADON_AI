/**
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * XADON AI • NPM MANAGER
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * Owner-only: install, remove, list, update, audit, fund
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

const CWD = '/home/container'; // project root

// ── COMMAND MODULE ──────────────────────────────────────────────
module.exports = {
    name: 'npm',
    alias: ['pkgs'],
    desc: 'Manage npm packages - owner only',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '♻️', success: '֎' },

    execute: async (sock, m, { reply, text }) => {
        if (!text) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    - NPM MANAGER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *XADON CORE*
│ ❏ Owner Only : ACTIVE
│ ❏ Commands :
│ ❏.npm install <pkg> → install
│ ❏.npm uninstall <pkg> → remove
│ ❏.npm list → list installed
│ ❏.npm update <pkg> → update specific
│ ❏.npm update → update all
│ ❏.npm audit → security scan
│ ❏.npm fund → funding links
╰─────────────────────────╯`
            );
        }

        const args = text.trim().split(/\s+/);
        const sub = args[0].toLowerCase();
        let cmd = '', statusMsg = '֎ Running...', successMsg = '';

        switch (sub) {
            case 'install':
                if (args.length < 2) return reply('_*✐ Usage*_ : ֎npm install <pkg>');
                cmd = `npm install ${args.slice(1).join(' ')}`;
                statusMsg = '_✪ Installing..._';
                successMsg = '_*✓ Installed!*_';
                break;

            case 'uninstall':
            case 'remove':
                if (args.length < 2) return reply('_*✐ Usage*_ : ֎npm uninstall <pkg>');
                cmd = `npm uninstall ${args.slice(1).join(' ')}`;
                statusMsg = '_✪ Uninstalling..._';
                successMsg = '_*✓ Uninstalled!*_';
                break;

            case 'list':
            case 'pkgs':
                cmd = 'npm list --depth=0';
                statusMsg = '_✪ Fetching list..._';
                successMsg = '*Installed packages:*';
                break;

            case 'update':
                cmd = args.length === 1? 'npm update' : `npm update ${args.slice(1).join(' ')}`;
                statusMsg = '_𓉤 Updating..._';
                successMsg = '_*✓ Updated!*_';
                break;

            case 'audit':
                cmd = 'npm audit --json';
                statusMsg = '_✪ Scanning vulnerabilities..._';
                successMsg = '_*Security audit:*_';
                break;

            case 'fund':
                cmd = 'npm fund';
                statusMsg = '_✪ Fetching funding info..._';
                successMsg = '_*Funding links:*_';
                break;

            default:
                return reply('_*✐ Unknown command*_ : ֎npm install/list/update/audit/fund/uninstall');
        }

        await reply(`${statusMsg}\n\`${cmd}\``);

        try {
            const { stdout, stderr } = await execPromise(cmd, { cwd: CWD });
            let output = (stdout + stderr).trim();

            if (output.length > 3500) output = output.substring(0, 3400) + '\n(truncated)';
            if (!output) output = 'Success (no output)';

            await reply(`${successMsg}\n\`\n${output}\n\`\``);

        } catch (err) {
            // npm audit returns exit code 1 when vulns found = normal
            if (sub === 'audit' && err.code === 1) {
                let vulnOutput = (err.stdout || '') + (err.stderr || '');
                vulnOutput = vulnOutput.trim();
                if (vulnOutput.length > 3500) vulnOutput = vulnOutput.substring(0, 3400) + '\n(truncated)';
                if (!vulnOutput) vulnOutput = '(vulnerabilities found, but no detailed output)';
                return reply(`_*Vulnerabilities found:*_\n\`\n${vulnOutput}\n\`\``);
            } else {
                let errorMsg = err.message || 'Unknown error';
                if (err.code) errorMsg += `\nExit code: ${err.code}`;
                if (err.stdout) errorMsg += `\n\`\n${err.stdout.substring(0, 1000)}\n\`\``;
                return reply(`_*❏ Failed:*_\n${errorMsg}`);
            }
        }
    }
};