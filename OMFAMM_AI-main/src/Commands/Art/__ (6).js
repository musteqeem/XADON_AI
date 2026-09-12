const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "greyscale",
    alias: ['grayscale', 'bw', 'blackwhite'],
    desc: 'Convert profile picture or image to greyscale',
    category: "Media",
    usage: ".greyscale [@user] or reply to an image",
    examples: [".greyscale", ".greyscale @2347043550282", "reply to image +.greyscale"],
    reactions: { start: '🎞️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎞️', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GREYSCALE EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}greyscale
│ ❏ ${prefix}greyscale @mention
│ ❏ ${prefix}greyscale <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "greyscale");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `🎞️ _Greyscale by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} GREYSCALE ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply greyscale effect`);
        }
    }
};