const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name: 'tagadmin',
    alias: ['admins', 'admin'],
    category: 'Group',
    desc: 'Tag all group admins',
    usage: '.tagadmin <message>',
    groupOnly: true,
    reactions: {
        start: '💫',
        success: '🌟',
        error: '❌'
    },

    execute: async (sock, m, { args, reply }) => {

        await sock.sendMessage(m.chat, { react: { text: '💫', key: m.key } });

        if (!m.isGroup) return reply('_*❌ GROUP ONLY*_');

        const metadata = await sock.groupMetadata(m.chat);
        const admins = metadata.participants
            .filter(p => p.admin !== null)
            .map(p => p.id);

        if (admins.length === 0) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply('_*❌ No admins found in this group*_');
        }

        const text = args.join(' ') || '📢 Calling all admins';

        let message =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ADMIN CALL*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOTICE*
│ ❏ Message : ${text}
│ ❏ Total Admins : ${admins.length}
╰─────────────────────────╯

`;

        for (let admin of admins) {
            message += `֎ @${admin.split('@')[0]}\n`;
        }

        await sock.sendMessage(
            m.chat,
            {
                text: message,
                mentions: admins
            },
            { quoted: m }
        );

        await sock.sendMessage(m.chat, { react: { text: '🌟', key: m.key } });
    }
};