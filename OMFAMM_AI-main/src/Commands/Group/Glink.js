const fetch = require('node-fetch');

module.exports = {
    name: 'invite',
    alias: ['grouplink', 'glink'],
    desc: 'Get group invite link',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🔗', success: '✅', error: '✘' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });

        if (!m.isGroup) return reply('_*✘ GROUP ONLY*_');

        try {
            const meta = await sock.groupMetadata(m.chat);
            const groupName = meta.subject;

            let inviteCode;
            try {
                inviteCode = await sock.groupInviteCode(m.chat);
            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply('_*✘ Bot needs admin rights to get group link*_');
            }

            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

            let thumbnail = null;
            try {
                const pp = await sock.profilePictureUrl(m.chat, 'image');
                thumbnail = await fetch(pp).then(r => r.buffer());
            } catch {}

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await sock.sendMessage(m.chat, {
                text: `_*${groupName}*_\n\n${inviteLink}`,
                contextInfo: {
                    externalAdReply: {
                        title: groupName,
                        body: 'WhatsApp Group Invite',
                        thumbnail: thumbnail,
                        sourceUrl: inviteLink,
                        mediaType: 1
                    }
                }
            }, { quoted: m });

        } catch (e) {
            console.error('[INVITE ERROR]', e);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            reply(`_*✘ Error: ${e.message}*_`);
        }
    }
};