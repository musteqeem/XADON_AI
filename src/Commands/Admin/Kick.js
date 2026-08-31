module.exports = {
    name: 'kick',
    alias: ['remove'],
    desc: 'Rem֎ve a user fr֎m the gr֎up',
    category: 'group',
    usage: '.kick @user / reply / number',

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('✘ GR֎UP ONLY');

        let target;

        // ✅ 1. Mentión
        if (m.mentionedJid?.length) {
            target = m.mentionedJid[0];

        // ✅ 2. Reply
        } else if (m.quoted) {
            target = m.quoted.sender;

        // ✅ 3. Number
        } else if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');

            if (number.length < 10)
                return reply('✘ INVALID F֎RMAT');

            target = number + '@s.whatsapp.net';

        } else {
            return reply(`✪ *KICK C֎MMAND* ✪

👊 Ways to kick:

• Reply to user →.kick
• Tag user →.kick @user
• Use number →.kick 234xxxxxxxxxx`);
        }

        // Prevent kicking b֎t itself
        if (target === sock.user.id.split(':')[0] + '@s.whatsapp.net') {
            return reply('✘ Cannot kick myself');
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

            await sock.sendMessage(m.chat, {
                react: { text: "😤", key: m.key }
            });

        } catch (err) {
            console.error('[KICK ERR֎R]', err?.message || err);

            let msg = '✘ Failed t֎ rem֎ve user\n';

            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += 'B֎t lacks admin permissi֎n';
            } else if (err.message?.includes('not-authorized')) {
                msg += 'Cann֎t rem֎ve this user';
            } else if (err.message?.includes('participant-not-found')) {
                msg += 'User n֎t in gr֎up';
            } else {
                msg += err.message || 'Unkn֎wn err֎r';
            }

            reply(msg);
        }
    }
};