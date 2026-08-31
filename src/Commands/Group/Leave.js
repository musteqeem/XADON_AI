module.exports = {
    name: 'exit',
    alias: ['leavegc', 'leave'],
    category: 'Group',
    desc: 'Leave the current group',
    ownerOnly: true,
    groupOnly: true,
    reactions: { start: '👋', success: '✅', error: '❌' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '👋', key: m.key } });

        const botName = process.env.BOT_NAME || 'XADON AI';

        try {
            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${botName} SYSTEM*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *LEAVING GROUP*
│ ❏ Status : Exiting now
│ ❏ Group  : ${m.chat}
╰─────────────────────────╯

_*👋 Good Bye!*_`
            );

            await sock.groupLeave(m.chat);

        } catch (err) {
            console.error('[LEAVE ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${botName} ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FAILED TO LEAVE*
│ ❏ Reason : ${err.message || 'Unknown Error'}
│ ❏ Group  : ${m.chat}
╰─────────────────────────╯

_*❌ Failed to Leave Group*_`
            );
        }
    }
};