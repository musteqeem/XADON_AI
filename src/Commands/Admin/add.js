const fetch = require('node-fetch');

module.exports = {
    name: 'add',
    alias: ['adduser'],
    category: 'Admin',
    admin: true,
    group: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply('`⟁⃝GROUP ONLY!Ꙭ`');
            if (!args.length) {
                return reply('_*📞 Provide a phone number*_\n_Example: .add 09027879263_');
            }

            // ✅ FORMAT NUMBER
            let number = args.join(' ').replace(/[^0-9]/g, '');
            if (number.startsWith('0')) number = '234' + number.slice(1);
            if (!number.startsWith('234')) number = '234' + number;

            const jid = number + '@s.whatsapp.net';
            const meta = await sock.groupMetadata(m.chat);
            const groupName = meta.subject;

            // ✅ TRY DIRECT ADD
            let res = await sock.groupParticipantsUpdate(m.chat, [jid], 'add');
            const status = res?.[0]?.status;

            if (status == 200 || status == '200') {
                return await sock.sendMessage(m.chat, {
                    text: `_*☢︎︎ @${number} has been added to the group.*_`,
                    mentions: [jid]
                }, { quoted: m });
            }

            // ❌ PRIVACY BLOCK → SEND INVITE WITH ?mode=gi_t
            if (['403', '401', '409'].includes(String(status))) {
                const freshCode = await sock.groupInviteCode(m.chat);
                const inviteLink = `https://chat.whatsapp.com/${freshCode}?mode=gi_t`;

                // Thumbnail
                let thumbnail = null;
                try {
                    const pp = await sock.profilePictureUrl(m.chat, 'image');
                    thumbnail = await fetch(pp).then(r => r.buffer());
                } catch {}

                // ✅ RAW PROTO — forces ?mode=gi_t to persist
                await sock.sendMessage(jid, {
                    extendedTextMessage: {
                        text: inviteLink,
                        matchedText: inviteLink,
                        canonicalUrl: inviteLink,
                        title: groupName,
                        description: 'WhatsApp Group Invite',
                        previewType: 1,
                        jpegThumbnail: thumbnail
                    },
                    raw: true
                });

                return await sock.sendMessage(m.chat, {
                    text: `_*📩 Invite sent to @${number}—͟͟͞͞𖣘*_`,
                    mentions: [jid]
                }, { quoted: m });
            }

            // ❌ OTHER ERROR
            return await sock.sendMessage(m.chat, {
                text: `_*✘ Failed to add @${number} (status: ${status})*_`,
                mentions: [jid]
            }, { quoted: m });

        } catch (e) {
            console.error('ADD ERROR:', e);
            reply(`𓄁 Error: ${e.message}`);
        }
    }
};
