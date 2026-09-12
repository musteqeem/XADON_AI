const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "gdesc",
    alias: ['setdescription', 'setgdesc', 'groupdesc'],
    desc: 'Set group description',
    category: "Group",
    usage: ".gdesc <description>",
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '📝', success: '✅', error: '✘' },

    execute: async (sock, m, { args, reply, isGroup, isAdmin, isBotAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '📝', key: m.key } });

        if (!isGroup) return reply('_*✘ GROUP ONLY*_');
        if (!isAdmin) return reply('_*✘ Only group admins can set description*_');
        if (!isBotAdmin) return reply('_*✘ Bot must be admin to edit group description*_');

        const newDescription = args.join(' ').trim();
        if (!newDescription) return reply('_*✘ Please provide a new group description*_');

        try {
            await sock.groupUpdateDescription(m.chat, newDescription);
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            reply('_*✓ Group description updated successfully!*_');
        } catch (err) {
            console.error(`[${BOT_NAME} GDESC ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            reply(`_*✘ Failed: ${err.message}*_`);
        }
    }
};