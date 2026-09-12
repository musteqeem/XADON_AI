const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'setname',
    alias: ['myname', 'username', 'setbotname'],
    desc: 'Change bot WhatsApp display name',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setname <new name> (or reply to text)',
    reactions: { start: '✏️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const name = args.join(' ').trim() || m.quoted?.body || m.quoted?.text || '';
        if (!name) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SETNAME*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}setname <new name>
│ ❏ Reply to text with ${prefix}setname
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        if (name.length > 25) {
            return reply(`✘ Name is too long. Max 25 characters`);
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '✏️', key: m.key } });
            await sock.updateProfileName(name);
            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SETNAME*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : Bot name updated
│ ❏ New Name : ${name}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );

        } catch (err) {
            console.error(`[${BOT_NAME} SETNAME ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Error: ${err.message}`);
        }
    }
};