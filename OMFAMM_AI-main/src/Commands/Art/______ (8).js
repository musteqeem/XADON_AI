const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "hitler",
    alias: [],
    desc: 'Add "Worse than Hitler" effect to profile picture or image',
    category: "Media",
    usage: ".hitler [@user] or reply to an image",
    examples: [".hitler", ".hitler @2347043550282", "reply to image +.hitler"],
    reactions: { start: '👿', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '👿', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} HITLER EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}hitler
│ ❏ ${prefix}hitler @mention
│ ❏ ${prefix}hitler <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "hitler");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `👿 _"Worse than Hitler" by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} HITLER ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply hitler effect`);
        }
    }
};