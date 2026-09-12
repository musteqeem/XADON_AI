module.exports = {
    name: 'pin',
    alias: ['pinmsg', 'unpin', 'pinned'],
    desc: 'Pin or unpin a message in group',
    category: 'Admin',
    groupOnly: false,
    adminOnly: false,
    usage: '.pin (reply to message) |.unpin |.pin 1d |.pin 7d |.pin 30d',
    reactions: { start: '📌', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix, quoted }) => {
        const sub = args[0]?.toLowerCase();

        if (sub === 'unpin' || sub === 'remove') {
            try {
                await sock.sendMessage(m.chat, {
                    pin: m.key,
                    type: 0
                });
                await sock.sendMessage(m.chat, { react: { text: '📌', key: m.key } });
                return reply('_Message unpinned_');
            } catch (error) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply('✘ Failed to unpin message');
            }
        }

        const durations = {
            '1d': 86400,
            '7d': 604800,
            '30d': 2592000,
            '24h': 86400,
            '1h': 3600
        };

        let time = 2592000;

        if (sub && durations[sub]) {
            time = durations[sub];
        }

        const target = quoted || m.quoted;
        if (!target) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • PIN MESSAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a message with ${prefix}pin
│
│ ❏ *Durations*
│ • ${prefix}pin → 30 days default
│ • ${prefix}pin 1d → 1 day
│ • ${prefix}pin 7d → 7 days
│ • ${prefix}pin 30d → 30 days
│ • ${prefix}unpin → Remove pin
│
│ ❏ Pins message to group chat
╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '📌', key: m.key } });

        try {
            await sock.sendMessage(m.chat, {
                pin: target.key || target.key,
                time: time,
                type: 1
            });

            let durationText = '30 days';
            if (time === 86400) durationText = '1 day';
            else if (time === 604800) durationText = '7 days';
            else if (time === 3600) durationText = '1 hour';

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • MESSAGE PINNED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DETAILS*
│ ❏ Status : Pinned
│ ❏ Duration : ${durationText}
│
│ ❏ BOT Verified
╰─────────────────────────╯`
            );

        } catch (error) {
            console.error('[PIN ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply('✘ Failed to pin message. Make sure bot is admin');
        }
    }
};