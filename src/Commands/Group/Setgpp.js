const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name: 'setgpp',
    alias: ['setgrouppp', 'setppgroup'],
    desc: 'Set group profile picture - reply to an image',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    usage: '.setgpp',
    reactions: { start: '🖼️', success: '✅', error: '❌' },

    execute: async (sock, m, { reply, prefix }) => {

        await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });

        if (!m.isGroup)
            return reply('_*❌ GROUP ONLY*_');

        if (!m.quoted || !m.quoted.mtype?.includes('image')) {
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SET GPP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Command : ${prefix}setgpp
│ ❏ Usage : Reply to an image with the command
╰─────────────────────────╯

_*📌 Reply to any image and type ${prefix}setgpp to set it as group profile picture*_`
            )
        }

        try {
            const buffer = await m.quoted.download();

            await sock.updateProfilePicture(m.chat, buffer);

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SET GPP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : Group Profile Updated
│ ❏ By : @${m.sender.split('@')[0]}
╰─────────────────────────╯

_*✅ Group profile picture updated successfully*_`
            );

        } catch (err) {
            console.error('[SETPPG ERROR]', err?.message || err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            let msg = 
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} SET GPP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FAILED*
│ ❏ Error : Could not update profile
`;

            if (err.message?.includes('admin') || err.message?.includes('permission')) {
                msg += `│ ❏ Reason : Bot lacks admin permission\n`;
            } else {
                msg += `│ ❏ Reason : ${err.message || 'Unknown error'}\n`;
            }

            msg += `╰─────────────────────────╯\n\n_*❌ Make sure I am admin with permission to change group info*_`;

            reply(msg);
        }
    }
};