module.exports = {
    name: 'hidetag',
    alias: ['htag', 'silenttag', 'tagall'],
    desc: 'Tag everyone silently',
    category: 'Group',
    usage: '.hidetag <message>',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '💬', success: '👀', error: '❌' },

    execute: async (sock, m, { args, reply, isGroup, isAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '💬', key: m.key } });

        if (!isGroup) return reply('_*❌ GROUP ONLY*_');
        if (!isAdmin) return reply('_*❌ Only group admins can use hidetag*_');

        try {
            const metadata = await sock.groupMetadata(m.chat);
            const participants = metadata.participants.map(p => p.id);

            const text = args.join(' ') || '_*Attention everyone*_';

            await sock.sendMessage(m.chat, {
                text: text,
                mentions: participants
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '👀', key: m.key } });
        } catch (err) {
            console.error('[HIDETAG ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`_*❌ Failed: ${err.message}*_`);
        }
    }
};