/**
 * Command: .dellang
 * Description: Deletes lang_prefs.json - removes all saved languages
 * Usage: .dellang
 * Requirements: Owner only + confirmation + backup
 */

const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const FILE = path.join(__dirname, "../../../database/lang_prefs.json");
const pendingConfirm = new Map(); // jid -> timeoutId

module.exports = {
    name: 'dellang',
    alias: ['remlang', 'clearlang', 'rmlang', 'deletelang'],
    desc: 'Delete lang_prefs.json - removes all saved language preferences',
    category: 'Tools',
    usage: '.dellang',
    owner: true,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase().trim();

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

            if (!fs.existsSync(FILE)) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ No language file found\n❏ File : lang_prefs.json does not exist`);
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
❏ Action : Delete ALL language prefs
❏ Target : lang_prefs.json
❏ Impact : Global + Group languages reset

❏ To Confirm : Reply *yes* within 30s
❏ To Cancel : Reply anything else
❏ Note : Auto backup will be created`
                );
            }

            // Step 2: Check confirmation
            if (body !== 'yes') {
                clearTimeout(pendingConfirm.get(jid));
                pendingConfirm.delete(jid);
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✓ ֎ Cancelled\n❏ Status : Language deletion aborted`);
            }

            clearTimeout(pendingConfirm.get(jid));
            pendingConfirm.delete(jid);

            // Backup before delete
            const backup = FILE + '.bak.' + Date.now();
            fs.copyFileSync(FILE, backup);

            fs.unlinkSync(FILE);

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LANGUAGES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
✓ Status : Deleted Successfully
❏ File : lang_prefs.json removed
❏ Backup : ${path.basename(backup)}
❏ Impact : All language settings cleared
❏ Note : Bot will use auto-detected language`
            );

        } catch (error) {
            if (pendingConfirm.has(jid)) {
                clearTimeout(pendingConfirm.get(jid));
                pendingConfirm.delete(jid);
            }
            console.error('[DELLANG ERROR]', error);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            let msg = `✘ ֎ Failed to delete languages\n❏ Error : ${error.message}`;
            if (error.code === 'ENOENT') msg += `\n❏ Reason : File does not exist`;
            else if (error.code === 'EACCES') msg += `\n❏ Reason : Permission denied`;

            return reply(msg);
        }
    }
};