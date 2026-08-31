const { applyEffect } = require("../Core/,,.js");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "rotate",
    alias: ['rot'],
    desc: 'Rotate replied image',
    category: "Media",
    usage: ".rotate [degrees] - reply to an image",
    examples: [".rotate", ".rotate 90", ".rotate 180"],
    reactions: { start: '🔄', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });

        if (!m.quoted?.mtype?.includes("image")) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ROTATE EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}rotate
│ ❏ ${prefix}rotate 90
│ ❏ ${prefix}rotate 180
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const buffer = await m.quoted.download();
            const result = await applyEffect(buffer, "rotate", args);

            await sock.sendMessage(m.chat, {
                image: result,
                mimetype: "image/png",
                caption: `🔄 _Rotated by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} ROTATE ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to rotate image`);
        }
    }
};