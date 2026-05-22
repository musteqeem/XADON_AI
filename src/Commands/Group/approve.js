module.exports = {
    name: 'approve',
    alias: ['approvejoin'],
    desc: 'Approve group join requests',
    category: 'Group',
    usage: '.approve all / number',

    execute: async (sock, m, { args, reply }) => {

        if (!m.isGroup)
            return reply('This command works only in groups');

        let requests;

        try {
            requests = await sock.groupRequestParticipantsList(m.chat);
        } catch (e) {
            return reply('Failed t֎ fetch join requests');
        }

        if (!requests.length)
            return reply('No pending join requests');

        // Approve all
        if (args[0]?.toLowerCase() === 'all') {
            const jids = requests.map(u => u.jid);

            await sock.groupRequestParticipantsUpdate(
                m.chat,
                jids,
                "approve"
            );

            return sock.sendMessage(m.chat, {
                text: `Appr֎ved all pending users\nTotal: ${jids.length}`
            });
        }

        let target;

        // Approve by number
        if (args[0]) {
            let number = args[0].replace(/[^0-9]/g, '');

            if (number.length < 10)
                return reply('Invalid number format');

            target = number + '@s.whatsapp.net';

        } else {
            // Default: approve first request
            target = requests[0].jid;
        }

        const exists = requests.find(u => u.jid === target);
        if (!exists)
            return reply('User not in request list');

        try {
            await sock.groupRequestParticipantsUpdate(
                m.chat,
                [target],
                "approve"
            );

            const num = target.split('@')[0];

            await sock.sendMessage(m.chat, {
                text: `@${num} request appr֎ved\nWelcome t֎ the group`,
                mentions: [target]
            });

            await sock.sendMessage(m.chat, {
                text: `Welcome @${num}\nIntr֎duce yourself`,
                mentions: [target]
            });

            await sock.sendMessage(m.chat, {
                react: { text: "✅", key: m.key }
            });

        } catch (err) {
            console.error('[APPROVE REQUEST ERROR]', err);
            reply(`Failed t֎ appr֎ve request\n${err.message}`);
        }
    }
};