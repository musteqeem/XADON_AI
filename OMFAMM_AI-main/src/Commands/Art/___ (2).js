const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "funny",
    alias: ['jokeoverhead', 'joke'],
    desc: 'Add "Joke overhead" effect to profile picture or image',
    category: "Media",
    usage: ".funny [@user] or reply to an image",
    examples: [".funny", ".funny @2347043550282", "reply to image +.funny"],
    reactions: { start: '😅', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '😅', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} FUNNY EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}funny
│ ❏ ${prefix}funny @mention
│ ❏ ${prefix}funny <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "funny");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `😅 _Joke Overhead by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} FUNNY ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply funny effect`);
        }
    }
};