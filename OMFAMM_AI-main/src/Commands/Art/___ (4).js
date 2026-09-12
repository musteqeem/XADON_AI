const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "trash",
    alias: ['garbage'],
    desc: 'Add trash effect to profile picture or image',
    category: "Media",
    usage: ".trash [@user] or reply to an image",
    examples: [".trash", ".trash @2347043550282", "reply to image +.trash"],
    reactions: { start: '🗑️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} TRASH EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}trash
│ ❏ ${prefix}trash @mention
│ ❏ ${prefix}trash <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "trash");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `🗑️ _TRASH by ${BOT_NAME}_ 🗑️`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} TRASH ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply trash effect`);
        }
    }
};