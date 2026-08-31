module.exports = {
    name: 'gcname',
    alias: ['setgcname', 'setgname', 'groupname'],
    desc: 'Set group name',
    category: 'Group',
    usage: '.gcname <new name>',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '✏️', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, isGroup, isAdmin, isBotAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '✏️', key: m.key } });

        if (!isGroup) return reply('_*❌ GROUP ONLY*_');
        if (!isAdmin) return reply('_*❌ Only group admins can set name*_');
        if (!isBotAdmin) return reply('_*❌ Bot must be admin to change group name*_');

        const newName = args.join(' ').trim();
        if (!newName) return reply('_*❌ Provide new name*_\n_*Example: .gcname XADON AI Group*_');

        try {
            await sock.groupUpdateSubject(m.chat, newName);
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            reply('_*✅ Group name updated successfully*_');

        } catch (err) {
            console.error('[GCNAME ERROR]', err?.message || err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            let msg = '_*❌ Failed to set name. Check character limit*_';
            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg = '_*❌ Bot lacks admin permission*_';
            }

            reply(msg);
        }
    }
};