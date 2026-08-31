const fetch = require('node-fetch');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name: 'revoke',
    alias: ['resetlink', 'newlink', 'revokelink'],
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🔗', success: '✅', error: '❌' },

    execute: async (sock, m, { reply }) => {
        try {
            if (!m.isGroup) return reply('_*❌ GROUP ONLY*_');

            await sock.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });

            const meta = await sock.groupMetadata(m.chat);
            const groupName = meta.subject;

            // ✅ REVOKE CURRENT INVITE CODE
            let newCode;
            try {
                newCode = await sock.groupRevokeInvite(m.chat);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply('_*❌ Failed to revoke link. Make sure I am admin*_');
            }

            const newLink = `https://chat.whatsapp.com/${newCode}?mode=gi_t`;

            // Thumbnail
            let thumbnail = null;
            try {
                const pp = await sock.profilePictureUrl(m.chat, 'image');
                thumbnail = await fetch(pp).then(r => r.buffer());
            } catch {}

            // Send revocation notice + new link with rich preview
            await sock.sendMessage(m.chat, {
                text: 
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} GROUP LINK*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *LINK REVOKED*
│ ❏ Group : ${groupName}
│ ❏ Status : Old link is now invalid
│ ❏ Action : New link generated
╰─────────────────────────╯

_*🔒 Previous invite link has been revoked*_
`
            }, { quoted: m });

            // Send new link with ?mode=gi_t rich preview
            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} NEW INVITE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GROUP LINK*
│ ❏ Group : ${groupName}
│ ❏ Link : ${newLink}
╰─────────────────────────╯

_*⚠️ Share this link carefully. Only admins can reset it again*_

${newLink}`
            });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (e) {
            console.error('REVOKE ERROR:', e);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`_*❌ Error*_ \n${e.message}`);
        }
    }
};