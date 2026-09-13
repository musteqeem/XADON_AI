const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'obf',
    alias: ['obfuscate'],
    category: 'Owner',
    owner: true,
    desc: 'Obfuscate a javascript file',
    usage: '.obf <filepath>',
    reactions: { start: '👀', success: '👌' },

    execute: async (sock, m, { args, reply }) => {
        let msg;
        const sendOrEdit = async text => {
            if (!msg) msg = await sock.sendMessage(m.chat, { text }, { quoted: m });
            else await sock.sendMessage(m.chat, { text, edit: msg.key });
        };

        const progressBar = percent => {
            const total = 10;
            const filled = Math.round(percent / 100 * total);
            return '▰'.repeat(filled) + '▱'.repeat(total - filled);
        };

        if (!args[0]) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *${BOT_NAME} OBF SYSTEM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE GUIDE*
│ ❏ Command :.obf <filepath>
│ ❏ Example :.obf Commands/Bot/ping.js
╰─────────────────────────╯`
        );

        const filePath = args[0];
        if (!fs.existsSync(filePath)) return reply(`✘ File not found.`);

        try {
            await sendOrEdit(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${BOT_NAME} OBF SYSTEM*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n${progressBar(20)}\n_*֎ Preparing...*_`);

            const backupPath = filePath + '.bak';
            if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);

            await sendOrEdit(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${BOT_NAME} OBF SYSTEM*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n${progressBar(70)}\n_*✪ patching...*_`);

            const command = `npx javascript-obfuscator "${filePath}" --output "${filePath}"`;

            exec(command, async (err) => {
                if (err) return await sendOrEdit(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} OBF SYSTEM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

✘ Process Failed:
${err.message}`
                );

                await sendOrEdit(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} OBF SYSTEM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

${progressBar(100)}
_*✦ SUCCESS*_

File obfuscated: ${filePath}
Backup: ${backupPath}
_Powered by ${BOT_NAME}_`
                );
            });

        } catch (e) {
            await sendOrEdit(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} OBF SYSTEM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

✘ Error:
${e.message}`
            );
        }
    }
};