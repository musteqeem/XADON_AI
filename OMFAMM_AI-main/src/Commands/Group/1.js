const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const activePins = new Map();

module.exports = {
    name: "pin",
    alias: ["gmpin", "msgpin", "pinmsg"],
    desc: "Pin a message for a specific duration",
    category: "Group",
    usage: ".pin <24hr|7d|30d>",
    examples: [".pin 24hr - reply to a message"],
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '📌', success: '✅', error: '✘' },

    execute: async (sock, m, { args, reply, prefix, isGroup, isAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '📌', key: m.key } });

        if (!isGroup) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _This command only works in groups_`);
        }

        if (!isAdmin) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Only group admins can pin messages_`);
        }

        if (!m.quoted) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} PIN MESSAGE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a message with ${prefix}pin <duration>
╰─────────────────────────╯
╭─֎ *DURATIONS*
│ ❏ 24hr - 24 hours
│ ❏ 7d - 7 days
│ ❏ 30d - 30 days
╰─────────────────────────╯`
            );
        }

        const timeInput = args[0]?.toLowerCase();
        const validTimes = ["24hr", "7d", "30d"];

        if (!timeInput ||!validTimes.includes(timeInput)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} PIN MESSAGE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *INVALID DURATION*
│ ❏ Use: 24hr | 7d | 30d
╰─────────────────────────╯`
            );
        }

        let duration = 0;
        let display = "";

        if (timeInput === "24hr") {
            duration = 86400;
            display = "24 hours";
        }
        if (timeInput === "7d") {
            duration = 604800;
            display = "7 days";
        }
        if (timeInput === "30d") {
            duration = 2592000;
            display = "30 days";
        }

        try {
            const messageKey = m.quoted.key;
            const pinId = `${m.chat}-${messageKey.id}`;

            await sock.sendMessage(m.chat, {
                pin: messageKey,
                type: 1,
                time: duration
            });

            activePins.set(pinId, {
                key: messageKey,
                chat: m.chat,
                expires: Date.now() + duration * 1000
            });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} PIN MESSAGE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Message pinned
│ ❏ Duration: ${display}
╰─────────────────────────╯`
            );

            // Auto unpin
            setTimeout(async () => {
                try {
                    await sock.sendMessage(m.chat, {
                        pin: messageKey,
                        type: 1,
                        time: 0
                    });
                    activePins.delete(pinId);
                    await sock.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
                } catch {}
            }, duration * 1000);

        } catch (err) {
            console.error(`[${BOT_NAME} PIN ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} PIN MESSAGE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to pin message
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};