const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "rainbow",
    alias: ['pride', 'lgbt'],
    desc: 'Add rainbow pride effect to profile picture or image',
    category: "Media",
    usage: ".rainbow [@user] or reply to an image",
    examples: [".rainbow", ".rainbow @2347043550282", "reply to image +.rainbow"],
    reactions: { start: '🌈', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🌈', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} RAINBOW EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}rainbow
│ ❏ ${prefix}rainbow @mention
│ ❏ ${prefix}rainbow <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "rainbow");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `🌈 _PRIDE by ${BOT_NAME}_ 🌈`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} RAINBOW ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply rainbow effect`);
        }
    }
};