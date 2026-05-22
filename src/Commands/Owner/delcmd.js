const fs = require('fs');
const path = require('path');

const STICKER_CMD_FILE = path.join(__dirname, '../database/sticker_cmds.json');

const loadFresh = () => {
    try {
        if (fs.existsSync(STICKER_CMD_FILE)) {
            return JSON.parse(fs.readFileSync(STICKER_CMD_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('[LOAD ERROR]', err);
    }
    return {};
};

const saveAndSync = (data) => {
    try {
        fs.writeFileSync(STICKER_CMD_FILE, JSON.stringify(data, null, 2));

        const setcmd = require('./setcmd.js');

        // 🔄 sync memory
        Object.keys(setcmd.stickerCmds).forEach(k => delete setcmd.stickerCmds[k]);
        Object.assign(setcmd.stickerCmds, data);

    } catch (err) {
        console.error('[SAVE ERROR]', err);
    }
};

module.exports = {
    name: 'delcmd',
    alias: ['uncmd', 'unbind'],
    description: 'Unbind command from sticker',
    category: 'owner',
    owner: true,
    usage: '.delcmd (reply to sticker)',

    execute: async (sock, m, { reply }) => {

        try {

            // 🗑️ reaction start
            await sock.sendMessage(m.chat, {
                react: { text: '🗑️', key: m.key }
            });

            const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stickerData = quotedMsg?.stickerMessage;

            // ❌ not a sticker
            if (!stickerData) {

                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELCMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ Please reply to a *bound sticker*

💡 Example:
Reply sticker → .delcmd

> ֎`);
            }

            const fileSha256 = stickerData.fileSha256;

            if (!fileSha256) {

                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELCMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ Could not read sticker hash

> ֎`);
            }

            const hash = Buffer.isBuffer(fileSha256)
                ? fileSha256.toString('hex')
                : String(fileSha256);

            const stickerCmds = loadFresh();

            // ❌ not found
            if (!stickerCmds[hash]) {

                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });

                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELCMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ This sticker has no command bound

🔎 Hash:
${hash}

> ֎`);
            }

            const removedCmd = stickerCmds[hash].split(/\s+/)[0];

            // 🧹 delete binding
            delete stickerCmds[hash];
            saveAndSync(stickerCmds);

            // ✨ success reaction
            await sock.sendMessage(m.chat, {
                react: { text: '✨', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • DELCMD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

✅ Sticker command removed

⚡ Removed Command:
${removedCmd}

🔄 Database synced successfully

> ֎`);

        } catch (err) {

            console.error('[DELCMD ERROR]', err);

            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });

            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • XADON AI • ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

❌ Failed to unbind sticker command

📛 Error:
${err.message || 'Unknown error'}

> ֎`);
        }
    }
};