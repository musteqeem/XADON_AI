const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "sepia",
    alias: ['vintage', 'old'],
    desc: 'Add sepia/vintage effect to profile picture or image',
    category: "Media",
    usage: ".sepia [@user] or reply to an image",
    examples: [".sepia", ".sepia @2347043550282", "reply to image +.sepia"],
    reactions: { start: '📷', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '📷', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SEPIA EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}sepia
│ ❏ ${prefix}sepia @mention
│ ❏ ${prefix}sepia <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "sepia");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `📷 _Vintage Sepia by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} SEPIA ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply sepia effect`);
        }
    }
};