/**
 * Command:.remfonts
 * Description: Deletes the botfont.json file (removes all saved fonts – global & group)
 * Usage:.remfonts
 * Requirements:
 * - Recommended: restrict to bot owner only (very destructive)
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, "../../../database/botfont.json");

module.exports = {
    name: 'delfonts',
    alias: ['remfonts', 'clearfonts', 'rmfonts'],
    desc: 'Delete botfont.json and remove all saved fonts',
    category: 'tools',
    usage: '.remfonts',
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
   ֎ • FONT DATABASE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ File : botfont.json
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
│ ❏ Target : botfont.json
│ ❏ Action : DELETE ALL FONTS
│ ❏ Scope : Global & Groups
│ ❏ Risk : IRREVERSIBLE
╰─────────────────────────╯

This will delete ALL saved fonts.
Type.remfonts confirm to proceed.`
                );
            }

            fs.unlinkSync(FILE);

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FONT DATABASE PURGED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ File : botfont.json
│ ❏ Status : DELETED
│ ❏ Scope : Global & Groups
│ ❏ Result : CLEAN
╰─────────────────────────╯
All custom fonts removed.
Bot will now use default styling.`
            );

            await sock.sendMessage(m.key.remoteJid, {
                react: { text: '֎', key: m.key }
            });

        } catch (error) {
            console.error('[XDN REMFONTS ERROR]', error);

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
│ ❏ File : botfont.json
╰─────────────────────────╯
Check console for full stack trace.`
            );
        }
    }
};