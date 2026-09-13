// SUDO MANAGEMENT - OWNER ONLY
const fs = require('fs');
const path = require('path');
const { getVar, setVar } = require('../../Plugin/configManager');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const ENV_PATH = path.join(process.cwd(), '.env');

// Clean number: remove +, spaces, and keep only digits
const cleanNumber = (num) => num.replace(/[^0-9]/g, '').trim();

// Saves to runtime + process.env +.env file
const saveSudo = (value) => {
    const cleaned = value.split(',')
       .map(cleanNumber)
       .filter(Boolean)
       .join(',');

    setVar('SUDO_NUMBERS', cleaned);
    process.env.SUDO_NUMBERS = cleaned;

    try {
        if (!fs.existsSync(ENV_PATH)) {
            fs.writeFileSync(ENV_PATH, `SUDO_NUMBERS=${cleaned}\n`);
            return;
        }

        const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
        let found = false;

        const updated = lines.map(line => {
            if (line.trim().startsWith('SUDO_NUMBERS=')) {
                found = true;
                return `SUDO_NUMBERS=${cleaned}`;
            }
            return line;
        });

        if (!found) updated.push(`SUDO_NUMBERS=${cleaned}`);
        fs.writeFileSync(ENV_PATH, updated.join('\n'));

    } catch (e) {
        console.error(`[${BOT_NAME} SUDO].env write failed:`, e.message);
    }
};

// Read clean list
const getList = () => {
    const fromEnv = process.env.SUDO_NUMBERS || '';
    const fromRuntime = String(getVar('SUDO_NUMBERS') || '');

    const combined = [fromEnv, fromRuntime]
       .join(',')
       .split(',')
       .map(cleanNumber)
       .filter(Boolean);

    return [...new Set(combined)];
};

module.exports = {
    name: 'sudo',
    alias: ['addsudo', 'delsudo', 'sudolist'],
    desc: 'Manage sudo users - trusted users with near-owner access',
    category: 'Owner',
    ownerOnly: true,
    usage: '.sudo list | add <number> | del <number> | clear',
    examples: ['.sudo add 2347043550282', '.sudo del 2347043550282', '.sudo list'],
    reactions: { start: '👑', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();
        const list = getList();

        //.sudo list
        if (!sub || sub === 'list') {
            if (!list.length) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SUDO LIST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ No sudo users set
│
╭─֎ *USAGE*
│ ❏ ${prefix}sudo add <number>
│ ❏ ${prefix}sudo del <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            const formatted = list
               .map((n, i) => `│ ❏ ${i + 1}. +${n}`)
               .join('\n');

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SUDO LIST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *TRUSTED USERS*
${formatted}
│
│ ❏ Total : ${list.length}
╰─────────────────────────╯
_Note: Sudo users have near-owner access_
_Powered by ${BOT_NAME}_`
            );
        }

        //.sudo add <number>
        if (sub === 'add') {
            let num = (args[1] || '').trim();
            if (!num) {
                return reply(`✘ Usage: ${prefix}sudo add <number>`);
            }

            num = cleanNumber(num);
            if (!num) return reply('✘ Please enter a valid phone number');

            if (list.includes(num)) {
                return reply(`✘ +${num} is already a sudo user`);
            }

            list.push(num);
            saveSudo(list.join(','));

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SUDO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ADDED*
│ ❏ Number : +${num}
│ ❏ Status : Saved to.env
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        //.sudo del / remove
        if (sub === 'del' || sub === 'remove') {
            let num = (args[1] || '').trim();
            if (!num) {
                return reply(`✘ Usage: ${prefix}sudo del <number>`);
            }

            num = cleanNumber(num);
            if (!num) return reply('✘ Please enter a valid phone number');

            const updated = list.filter(n => n!== num);

            if (updated.length === list.length) {
                return reply(`✘ +${num} is not a sudo user`);
            }

            saveSudo(updated.join(','));
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SUDO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *REMOVED*
│ ❏ Number : +${num}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        //.sudo clear
        if (sub === 'clear') {
            saveSudo('');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SUDO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CLEARED*
│ ❏ All sudo users removed
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // Help
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SUDO HELP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}sudo list
│ ❏ ${prefix}sudo add <number>
│ ❏ ${prefix}sudo del <number>
│ ❏ ${prefix}sudo clear
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};