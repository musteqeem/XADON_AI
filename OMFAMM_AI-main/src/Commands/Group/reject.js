const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name: 'reject',
    alias: ['rejectall', 'denyall'],
    desc: 'Reject all pending group join requests',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🍃', success: '✅', error: '❌' },

    execute: async (sock, m, { reply }) => {
        try {
            await sock.sendMessage(m.chat, { react: { text: '🍃', key: m.key } });

            const requests = await sock.groupRequestParticipantsList(m.chat);

            if (!requests || requests.length === 0) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} JOIN REQUESTS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Pending Requests : 0
│ ❏ Action : Nothing to reject
╰─────────────────────────╯

_*✅ No pending requests right now*_`
                );
            }

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} JOIN REQUESTS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *REJECTING*
│ ❏ Found : ${requests.length} request(s)
│ ❏ Action : Rejecting all...
╰─────────────────────────╯

_*⏳ Please wait...*_`
            );

            const jids = requests.map(r => r.jid);
            await sock.groupRequestParticipantsUpdate(m.chat, jids, 'reject');

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} JOIN REQUESTS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DONE*
│ ❏ Rejected : ${jids.length} member(s)
│ ❏ Status : All cleared
╰─────────────────────────╯

_*✅ All pending requests have been rejected*_`
            );

        } catch (err) {
            console.error('[REJECT ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            if (err.message?.includes('not-authorized')) {
                return reply('_*❌ Make me an admin first to use this command*_');
            }
            return reply(`_*❌ Error*_ \n${err.message}`)
        }
    }
};