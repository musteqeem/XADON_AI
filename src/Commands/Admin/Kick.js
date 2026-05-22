module.exports = {
    name: 'kick',
    alias: ['remove'],
    desc: 'Remove a user from the gr֎up',
    category: 'group',
    usage: '.kick @user',
    reactions: {
        start: '🤬',
        success: '😤'
    },

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('✘ GROUP ONLY');

        let target;

        if (m.mentionedJid?.length) {
            target = m.mentionedJid[0];
        } else if (args[0]) {
            const number = args[0].replace(/[^0-9]/g, '');
            if (number.length < 10)
                return reply('✘ INVALID FORMAT');
            target = number + '@s.whatsapp.net';
        } else {
            return reply('✘ MENTION A USER\n✪.kick @user');
        }

        try {
            await sock.groupParticipantsUpdate(m.chat, [target], 'remove');

            await new Promise(r => setTimeout(r, 1500));

            const removedNumber = target.split('@')[0];

            await reply('*✓ Kicked successfully*');

            await sock.sendMessage(m.chat, {
                text: `✦ @${removedNumber} removed from group`,
                mentions: [target]
            });

        } catch (err) {
            console.error('[KICK ERROR]', err?.message || err);

            let msg = '✘ Failed t֎ remove user\n';

            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += 'Bot lacks admin permission';
            } else if (err.message?.includes('not-authorized')) {
                msg += 'Cannot remove this user';
            } else {
                msg += err.message || 'Unknown error';
            }

            reply(msg);
        }
    }
};