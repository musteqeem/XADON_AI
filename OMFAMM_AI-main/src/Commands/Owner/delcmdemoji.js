const { emojiCmds, saveEmojiCmds } = require('./setemoji.js');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'delemoji',
    alias: ['delemoji', 'unbindemoji', 'rmeemoji', 'delemojicmd'],
    desc: 'Delete an emoji-to-command binding',
    category: 'Owner',
    ownerOnly: true,
    usage: '.delemoji <emoji> |.delemoji (reply to emoji)',

    execute: async (sock, m, { args, reply, prefix }) => {
        // ── Determine the emoji to delete ─────────────────────
        let emoji;

        // MODE 1: Reply to an emoji message
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';

        if (quotedText &&!args[0]) {
            emoji = quotedText.trim();
        }
        // MODE 2: Direct.delemoji <emoji>
        else if (args[0]) {
            emoji = args[0];
        }
        // ERROR: Nothing provided
        else {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} DELETE EMOJI*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}delemoji <emoji>
│ ❏ ${prefix}delemoji (reply to emoji)
│
╭─֎ *EXAMPLE*
│ ❏ ${prefix}delemoji 😂
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // ── Check if binding exists ───────────────────────────
        if (!emojiCmds[emoji]) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} DELETE EMOJI*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ Emoji : ${emoji}
│ ❏ Status: No binding found
│
│ ❏ Use ${prefix}listemoji to see all
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // ── Delete and confirm ──────────────────────────────────
        const oldCmd = emojiCmds[emoji];
        delete emojiCmds[emoji];
        saveEmojiCmds();

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} DELETE EMOJI*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DELETED*
│ ❏ Emoji : ${emoji}
│ ❏ Command : ${prefix}${oldCmd}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};