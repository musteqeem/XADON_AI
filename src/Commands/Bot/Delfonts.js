const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const FILE = path.join(__dirname, "../../../database/botfont.json");
const pendingConfirm = new Map(); // jid -> timeoutId

module.exports = {
    name: 'delfonts',
    alias: ['remfonts', 'clearfonts', 'rmfonts', 'deletefonts'],
    desc: 'Delete botfont.json - removes all saved fonts',
    category: 'Tools',
    usage: '.delfonts',
    owner: true,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase().trim();

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

            if (!fs.existsSync(FILE)) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ No fonts found\n❏ File : botfont.json does not exist`);
            }

            // Step 1: Ask confirmation
            if (!pendingConfirm.has(jid)) {
                const timeout = setTimeout(() => pendingConfirm.delete(jid), 30000); // 30s timeout
                pendingConfirm.set(jid, timeout);
                
                await sock.sendMessage(jid, { react: { text: "⚠", key: m.key } });
                return reply(
                    `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} DANGER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Delete ALL fonts
❏ Target : botfont.json
❏ Impact : Global + Group fonts will be removed

❏ To Confirm : Reply *yes* within 30s
❏ To Cancel : Reply anything else`
                );
            }

            // Step 2: Check confirmation
            if (body !== 'yes') {
                clearTimeout(pendingConfirm.get(jid));
                pendingConfirm.delete(jid);
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✓ ֎ Cancelled\n❏ Status : Font deletion aborted`);
            }

            clearTimeout(pendingConfirm.get(jid));
            pendingConfirm.delete(jid);
            fs.unlinkSync(FILE);

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FONTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
✓ Status : Deleted Successfully
❏ File : botfont.json removed
❏ Impact : All custom fonts cleared
❏ Note : Bot will use default styling now`
            );

        } catch (error) {
            if (pendingConfirm.has(jid)) {
                clearTimeout(pendingConfirm.get(jid));
                pendingConfirm.delete(jid);
            }
            console.error('[DELFONTS ERROR]', error);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            let msg = `✘ ֎ Failed to delete fonts\n❏ Error : ${error.message}`;
            if (error.code === 'ENOENT') msg += `\n❏ Reason : File does not exist`;
            else if (error.code === 'EACCES') msg += `\n❏ Reason : Permission denied`;

            return reply(msg);
        }
    }
};