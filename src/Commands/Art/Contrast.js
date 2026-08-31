const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "contrast",
    alias: ['cont'],
    desc: 'Adjust contrast of profile picture or image',
    category: "Media",
    usage: ".contrast [@user] or reply to an image",
    examples: [".contrast", ".contrast @2347043550282", "reply to image +.contrast 50"],
    reactions: { start: '🌗', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🌗', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CONTRAST EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}contrast
│ ❏ ${prefix}contrast @mention
│ ❏ ${prefix}contrast <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "contrast", args);
            await sock.sendMessage(m.chat, {
                image: result,
                mimetype: "image/png",
                caption: `🌗 _Contrast adjusted by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} CONTRAST ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to adjust contrast`);
        }
    }
};