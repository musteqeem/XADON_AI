const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "trigger",
    alias: ['triggered'],
    desc: 'Add triggered effect to profile picture or image',
    category: "Media",
    usage: ".trigger [@user] or reply to an image",
    examples: [".trigger", ".trigger @2347043550282", "reply to image +.trigger"],
    reactions: { start: '😤', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '😤', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} TRIGGER EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}trigger
│ ❏ ${prefix}trigger @mention
│ ❏ ${prefix}trigger <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "trigger");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `😤 _TRIGGERED by ${BOT_NAME}_ 😤`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} TRIGGER ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply trigger effect`);
        }
    }
};