module.exports = {
    name: 'gdesc',
    alias: ['setdescription'],
    desc: 'Add gr֎up description',
    category: 'Gools',
    execute: async (sock, m, { args, reply, isGroup }) => {
        try {
            if (!isGroup) return reply('This command works only in groups');
            if (!args.length) return reply('Please provide a new group description');

            const newDescription = args.join(' ');
            await sock.groupUpdateDescription(m.chat, newDescription);
            reply('Gr֎up description updated successfully');
        } catch (error) {
            reply('An error occurred while updating the group description. Please try again later');
        }
    }
};