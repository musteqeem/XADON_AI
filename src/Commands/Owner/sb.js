const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'bio',
    alias: ['setbio', 'about', 'setabout'],
    desc: 'Change bot WhatsApp bio/about',
    category: 'Owner',
    ownerOnly: true,
    usage: '.bio <new bio> (or reply to text)',
    reactions: { start: '✏️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply }) => {
        const bio = args.join(' ').trim() || m.quoted?.body || m.quoted?.text || '';
        if (!bio) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} BIO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}bio <new bio>
│ ❏ Reply to text with ${prefix}bio
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        if (bio.length > 139) {
            return reply(`✘ Bio is too long. Max 139 characters`);
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '✏️', key: m.key } });
            await sock.updateProfileStatus(bio);
            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
            
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} BIO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : Bio updated
│ ❏ New Bio : ${bio}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );

        } catch (err) {
            console.error(`[${BOT_NAME} BIO ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Error: ${err.message}`);
        }
    }
};