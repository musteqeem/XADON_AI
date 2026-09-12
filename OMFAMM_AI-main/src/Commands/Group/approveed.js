const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "approve",
    alias: ['acceptall', 'approveall', 'accept'],
    desc: 'Approve all pending group join requests',
    category: "Group",
    usage: ".approve",
    examples: [".approve - approve all requests", ".approve reject - reject all requests"],
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '☘️', success: '🍃', error: '✘' },

    execute: async (sock, m, { args, reply, prefix, isGroup, isAdmin, isBotAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '☘️', key: m.key } });

        if (!isGroup) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _This command only works in groups_`);
        }

        try {
            const requests = await sock.groupRequestParticipantsList(m.chat);

            if (!requests || requests.length === 0) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} APPROVE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ No pending join requests
╰─────────────────────────╯`
                );
            }

            const action = args[0]?.toLowerCase() === 'reject' ? 'reject' : 'approve';
            const actionText = action === 'approve' ? 'Approving' : 'Rejecting';
            const successText = action === 'approve' ? 'Approved' : 'Rejected';

            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} APPROVE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *PROCESSING*
│ ❏ ${actionText}...
│ ❏ Found: ${requests.length} request(s)
╰─────────────────────────╯`
            );

            const jids = requests.map(r => r.jid);
            await sock.groupRequestParticipantsUpdate(m.chat, jids, action);

            await sock.sendMessage(m.chat, { react: { text: '🍃', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} APPROVE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Done!
│ ❏ ${jids.length} member(s) ${successText}
╰─────────────────────────╯`
            );

        } catch (err) {
            console.error(`[${BOT_NAME} APPROVE ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });

            if (err.message?.includes('not-authorized')) {
                return reply(`✘ _Make me an admin first_`);
            }
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} APPROVE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};