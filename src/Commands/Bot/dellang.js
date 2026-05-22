/**
 * Command:.dellang
 * Description: Deletes the language preference file (lang_prefs.json)
 * Removes all saved languages – global & group
 * Usage:.dellang
 * Requirements:
 * - Recommended: restrict to bot owner only (very destructive)
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, "../../../database/lang_prefs.json");

module.exports = {
    name: 'dellang',
    alias: ['remlang', 'clearlang', 'rmlang'],
    desc: 'Delete lang_prefs.json and remove all saved language preferences',
    category: 'tools',
    usage: '.dellang',
    reactions: {
        start: '♻️',
        success: '֎'
    },
    // isOwner: true, // ← uncomment in your loader if you have owner check

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!fs.existsSync(FILE)) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • LANG DATABASE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ File : lang_prefs.json
│ ❏ Status : NOT FOUND
│ ❏ Action : No cleanup needed
╰─────────────────────────╯`
                );
            }

            // Safety confirmation
            if (!args[0] || args[0].toLowerCase()!== 'confirm') {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DESTRUCTIVE ACTION WARNING •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *WARNING*
│ ❏ Target : lang_prefs.json
│ ❏ Action : DELETE ALL LANGS
│ ❏ Scope : Global & Groups
│ ❏ Risk : IRREVERSIBLE
╰─────────────────────────╯

This will delete ALL saved language preferences.
Type.dellang confirm to proceed.`
                );
            }

            fs.unlinkSync(FILE);

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • LANG DATABASE PURGED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ File : lang_prefs.json
│ ❏ Status : DELETED
│ ❏ Scope : Global & Groups
│ ❏ Result : CLEAN
╰─────────────────────────╯
All custom language settings removed.
Bot will now use auto-detected language.`
            );

            await sock.sendMessage(m.key.remoteJid, {
                react: { text: '֎', key: m.key }
            });

        } catch (error) {
            console.error('[XDN DELLANG ERROR]', error);

            let reason = 'Unknown error';
            if (error.code === 'ENOENT') reason = 'File does not exist';
            else if (error.code === 'EACCES') reason = 'Permission denied';
            else if (error.code === 'EBUSY') reason = 'File is busy';

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • PURGE FAILED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR REPORT*
│ ❏ Code : ${error.code || 'UNKNOWN'}
│ ❏ Reason : ${reason}
│ ❏ File : lang_prefs.json
╰─────────────────────────╯
Check console for full stack trace.`
            );
        }
    }
};