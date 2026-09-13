const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'x',
    alias: ['cmd', 'run'],
    desc: 'Run any shell command on the server - admin only',
    category: 'Owner',
    ownerOnly: true,
    usage: '.x <command>\nExamples:\n.x ls -la\n.x pwd\n.x node -v',
    reactions: { start: '⚙️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply }) => {
        if (args.length === 0) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SHELL*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ .x <command>
│
╭─֎ *EXAMPLES*
│ ❏ .x ls -la
│ ❏ .x pwd
│ ❏ .x git clone https://github.com/...
│ ❏ .x npm install
╰─────────────────────────╯
_Warning: Admin only. Use with caution_
_Powered by ${BOT_NAME}_`
            );
        }

        const command = args.join(' ');
        
        // Dangerous command blacklist
        const blacklist = [
            'rm -rf', 'sudo rm', 'rm -r /*', '>/dev/', 
            ':(){:|:&};:', 'mkfs', 'dd if=', 'poweroff', 
            'shutdown', 'reboot', 'halt', 'del /f /q *', 'rd /s /q'
        ];

        if (blacklist.some(cmd => command.toLowerCase().includes(cmd))) {
            return reply(`✘ Dangerous command blocked for safety.`);
        }

        await reply(`⚡ Running: \`${command}\` ...`);

        try {
            const { stdout, stderr } = await execPromise(command, {
                cwd: process.cwd(),
                timeout: 60000,
                maxBuffer: 1024 * 1024 * 5
            });

            let output = '';
            if (stdout.trim()) output += `\`\`\`STDOUT:\n${stdout.trim()}\`\`\``;
            if (stderr.trim()) output += `\n\`\`\`STDERR:\n${stderr.trim()}\`\`\``;
            if (!output) output = '```Command executed successfully - no output```';

            // Split long output
            if (output.length > 4000) {
                const chunks = output.match(/.{1,4000}/g);
                for (const chunk of chunks) {
                    await reply(chunk);
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
            } else {
                await reply(output);
            }

        } catch (err) {
            const errorMsg = err.stderr?.trim() || err.message || 'Unknown error';
            let response = `❌ Command failed\n\n\`\`${errorMsg}\`\``;
            if (err.code !== undefined) response += `\nExit code: ${err.code}`;
            await reply(response);
        }
    }
};