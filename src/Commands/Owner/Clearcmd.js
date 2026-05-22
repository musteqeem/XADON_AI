const fs = require('fs');
const path = require('path');

const STICKER_CMD_FILE = path.join(__dirname, '../database/sticker_cmds.json');

const saveAndSync = (data) => {
    try {
        fs.writeFileSync(STICKER_CMD_FILE, JSON.stringify(data, null, 2));

        const setcmd = require('./setcmd.js');

        // 🔄 sync memory
        Object.keys(setcmd.stickerCmds).forEach(k => delete setcmd.stickerCmds[k]);
        Object.assign(setcmd.stickerCmds, data);

    } catch (err) {
        console.error('[CLEARCMD SAVE ERROR]', err);
    }
};

module.exports = {
    name: 'clearcmd',
    alias: ['resetcmd', 'clrcmd'],
    description: 'Delete all bound sticker commands',
    category: 'owner',
    owner: true,
    usage: '.clearcmd',

    execute: async (sock, m, { reply }) => {

        try {

            // ⚠️ warning reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⚠️', key: m.key }
            });

            // 🧹 clear database
            saveAndSync({});

            await sock.sendMessage(m.chat, {
                react: { text: '✨', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • CLEARCMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

✅ All sticker commands cleared successfully

🧹 Status: Database emptied
🔄 Memory synced

💡 You can now add new commands using:
.setcmd

> ֎`);

        } catch (err) {

            console.error('[CLEARCMD ERROR]', err);

            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ Failed to clear sticker commands

📛 Error:
${err.message || 'Unknown error'}

> ֎`);
        }
    }
};