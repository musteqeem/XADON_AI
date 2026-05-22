module.exports = {
    name: 'delgdesc',
    alias: ['deletedescription'],
    desc: 'Delete gr֎up description',
    category: 'Group',
    execute: async (sock, m, { isGroup, groupMeta, reply }) => {
        if (!isGroup) return reply('This command works only in groups');

        try {
            const newDesc = '';
            await sock.groupUpdateDescription(m.chat, newDesc);
            reply('Gr֎up description deleted successfully');
        } catch (error) {
            reply(`Failed t֎ delete gr֎up description: ${error.message}`);
        }
    }
};