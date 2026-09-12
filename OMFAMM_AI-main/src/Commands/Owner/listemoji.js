const { emojiCmds } = require('./setemoji.js');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'listemoji',
    alias: ['emojilist', 'emojicmds', 'listemoji'],
    desc: 'List all emoji-to-command bindings',
    category: 'Owner',
    ownerOnly: true,
    usage: '.listemoji',

    execute: async (sock, m, { reply, prefix }) => {
        const entries = Object.entries(emojiCmds);

        if (entries.length === 0) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI COMMANDS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *LIST*
│ ❏ Status : No emoji bindings found
│
│ ❏ Use ${prefix}setemoji to add one
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        const formatted = entries
            .map(([emoji, command], i) => `│ ❏ ${i + 1}. ${emoji} → ${prefix}${command}`)
            .join('\n');

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} EMOJI COMMANDS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *LIST* [${entries.length}]
${formatted}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};