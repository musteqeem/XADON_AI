const { applyEffect, getTargetBuffer } = require("../Core/֎.js");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "shit",
    alias: ["poop", "eww"],
    desc: 'Add shit effect to profile picture or image',
    category: "Media",
    usage: ".shit [@user] or reply to an image",
    examples: [".shit", ".shit @2347043550282", "reply to image +.shit"],
    reactions: { start: '💩', success: '😁', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '💩', key: m.key } });

        const targetBuffer = await getTargetBuffer(sock, m, args);

        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SHIT EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}shit
│ ❏ ${prefix}shit @mention
│ ❏ ${prefix}shit <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "shit");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `💩 _Eww, you stepped in shit!_\n_Powered by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '😁', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} SHIT ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply shit effect`);
        }
    }
};