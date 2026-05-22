module.exports = {
    name: 'resetlink',
    alias: ['relink', 'resetgroup'],
    category: 'group',
    desc: 'Reset WhatsApp gr֎up invite link with preview',

    execute: async (sock, m, { reply }) => {
        if (!m.isGroup) return reply('✘ Only works in groups');

        try {
            await sock.groupRevokeInvite(m.chat);

            const code = await sock.groupInviteCode(m.chat);
            const newLink = `https://chat.whatsapp.com/${code}`;

            const metadata = await sock.groupMetadata(m.chat);

            let iconUrl = null;
            try {
                iconUrl = await sock.profilePictureUrl(m.chat, 'image');
            } catch {}

            await sock.sendMessage(
                m.chat,
                {
                    text: `✦ *GR֎UP LINK RESET* ✦\n${newLink}`,
                    contextInfo: {
                        externalAdReply: {
                            title: metadata.subject,
                            body: "Tap t֎ open group invite",
                            sourceUrl: newLink,
                            thumbnailUrl: iconUrl || undefined,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            showAdAttribution: false
                        }
                    }
                },
                { quoted: m }
            );

        } catch (err) {
            console.error('[RESETLINK ERROR]', err);
            reply('✘ Failed t֎ reset link. Make sure I am admin!');
        }
    }
};