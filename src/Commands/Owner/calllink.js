// ── calllink.js ───────────────────────────────────────────────────
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'calllink',
    alias: ['createcall', 'vclink'],
    desc: 'Create a WhatsApp call link',
    category: 'Owner',
    ownerOnly: true,
    usage: '.calllink [audio/video]',
    reactions: { start: '📞', success: '🔗', error: '✘' },

    execute: async (sock, m, { args, reply }) => {
        const type = args[0]?.toLowerCase() === 'video'? 'video' : 'audio';

        try {
            await sock.sendMessage(m.chat, { react: { text: '📞', key: m.key } });

            const token = await sock.createCallLink(type);
            if (!token) throw new Error('No token returned');

            const link = `https://call.whatsapp.com/voice/${token}`;
            await sock.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });

            // Send with clickable button template
            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CALL LINK*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DETAILS*
│ ❏ Type : ${type === 'video'? 'Video Call' : 'Audio Call'}
│ ❏ Link : ${link}
│
│ ❏ Click the button below to join
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`,
                nativeFlow: [{
                    text: `${type === 'video'? '🎥 Join Video Call' : '🎙 Join Audio Call'}`,
                    url: link,
                    useWebview: true
                }]
            }, { quoted: m });

        } catch (err) {
            console.error(`[${BOT_NAME} CALLLINK ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Error: ${err.message}`);
        }
    }
};