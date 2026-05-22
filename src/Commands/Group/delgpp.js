module.exports = {
    name: 'delgpp',
    alias: ['removegpp', 'deletegpp', 'rmgpp', 'delgrouppp'],
    description: 'Remove the current group profile picture',
    category: 'Group',
    usage: '.delgpp',

    execute: async (sock, m, { reply, isAdmin, isBotAdmin }) => {

        if (!m.isGroup)
            return reply('This command works only in groups');

        if (!isAdmin)
            return reply('Only group admins can use this command');

        if (!isBotAdmin)
            return reply('I need t֎ be admin t֎ remove the group picture');

        await sock.sendMessage(m.chat, {
            react: { text: "⟳", key: m.key }
        });

        try {
            await sock.removeProfilePicture(m.chat);

            await sock.sendMessage(m.chat, {
                text: `Gr֎up profile picture removed\nUpdate successful`
            });

            await sock.sendMessage(m.chat, {
                react: { text: "✓", key: m.key }
            });

        } catch (err) {
            console.error('[DELGPP ERROR]', err?.message || err);

            await sock.sendMessage(m.chat, {
                react: { text: "✗", key: m.key }
            });

            let msg = 'Failed t֎ remove group profile picture\n';

            if (err.message?.includes('not-authorized') || err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += 'Bot needs admin rights';
            } else if (err.message?.includes('no profile') || err.message?.includes('not found')) {
                msg += 'This gr֎up has no profile picture set';
            } else if (err.message?.includes('no-id') || err.message?.includes('Illegal')) {
                msg += 'Update y֎ur Baileys version';
            } else {
                msg += err.message || 'Unknown error';
            }

            reply(msg);
        }
    }
};