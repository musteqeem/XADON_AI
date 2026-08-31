const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "facepalm",
    alias: ['fp', 'palm'],
    desc: 'Add facepalm effect to profile picture or image',
    category: "Media",
    usage: ".facepalm [@user] or reply to an image",
    examples: [".facepalm", ".facepalm @2347043550282", "reply to image +.facepalm"],
    reactions: { start: '🤦', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🤦', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} FACEPALM EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}facepalm
│ ❏ ${prefix}facepalm @mention
│ ❏ ${prefix}facepalm <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "facepalm");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `🤦 _Facepalm by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} FACEPALM ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply facepalm effect`);
        }
    }
};