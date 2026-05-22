module.exports = {
    command: 'creategc',
    alias: ['creategroup'],
    description: 'Create a new WhatsApp group',
    category: 'owner',
    usage: '.creategc <group name>',

    execute: async (sock, m, { args, reply }) => {

        const groupName = args.join(' ').trim();

        if (!groupName)
            return reply('Usage: .creategc <group name>\nExample: .creategc My Gr֎up');

        if (groupName.length > 100)
            return reply('Group name cannot exceed 100 characters');

        await sock.sendMessage(m.chat, {
            react: { text: "✅", key: m.key }
        });

        try {
            const result = await sock.groupCreate(groupName, [m.sender]);

            await sock.sendMessage(m.chat, {
                text: `Gr֎up created: ${result.subject}\nID: ${result.id}\nY֎u are admin`
            });

            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.error('[CREATEGC ERROR]', err?.message || err);

            await sock.sendMessage(m.chat, {
                react: { text: "❌", key: m.key }
            });

            let msg = 'Failed t֎ create group\n';

            if (err.message?.includes('too many')) {
                msg += 'Y֎u have reached the group creation limit';
            } else if (err.message?.includes('banned')) {
                msg += 'Cannot create group at this time';
            } else {
                msg += err.message || 'Unknown error';
            }

            reply(msg);
        }
    }
};