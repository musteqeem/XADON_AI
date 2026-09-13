const fetch = require('node-fetch');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';

module.exports = {
    name: 'ginfo',
    alias: ['groupinfo', 'gi'],
    desc: `Get group full details - name, link, and description`,
    category: 'Group',
    usage: '.ginfo',
    groupOnly: true,

    execute: async (sock, m, { reply }) => {
        try {
            const metadata = await sock.groupMetadata(m.chat).catch(() => null);
            if (!metadata) return reply(`✘ ❏ Failed to fetch group info`);

            const groupName = metadata.subject || 'Unknown Group';
            const desc = metadata.desc || 'No description set';
            const participants = metadata.participants?.length || 0;
            const ownerJid = metadata.owner || null;
            const ownerNumber = ownerJid? ownerJid.split('@')[0] : 'unknown';

            // Try to get invite code
            let inviteLink = null;
            let linkStatus = '✘ Bot is not admin - cannot fetch invite link';

            try {
                const code = await sock.groupInviteCode(m.chat);
                if (code) {
                    inviteLink = `https://chat.whatsapp.com/${code}?mode=gi_t`;
                    linkStatus = null;
                }
            } catch {}

            // Thumbnail
            let thumbnail = null;
            try {
                const pp = await sock.profilePictureUrl(m.chat, 'image');
                thumbnail = await fetch(pp).then(r => r.buffer());
            } catch {}

            const captionText = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GROUP INFO •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Name:* ${groupName}\n❏ *Members:* ${participants}\n❏ *Owner:* @${ownerNumber}\n❏ *Description:* ${desc}\n❏ Verified by ${BOT_NAME}`;

            const mentions = ownerJid? [ownerJid] : [];

            if (!inviteLink) {
                return await sock.sendMessage(m.chat, {
                    text: `${captionText}\n\n${linkStatus}`,
                    mentions
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, {
                text: `${captionText}\n\n❏ *Invite:* ${inviteLink}`,
                mentions
            }, { quoted: m });

        } catch (e) {
            console.error('[GINFO ERROR]', e);
            reply(`✘ ❏ Error: ${e.message}`);
        }
    }
};