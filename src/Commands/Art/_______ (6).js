const { applyEffect, getTargetBuffer } = require("../Core/֎");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "affect",
    alias: ['baby', 'cry'],
    desc: 'Add "Affect/Baby" effect to profile picture or image',
    category: "Media",
    usage: ".affect [@user] or reply to an image",
    examples: [".affect", ".affect @2347043550282", "reply to image +.affect"],
    reactions: { start: '😢', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '😢', key: m.key } });
        
        const targetBuffer = await getTargetBuffer(sock, m, args);
        
        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AFFECT EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}affect
│ ❏ ${prefix}affect @mention
│ ❏ ${prefix}affect <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        try {
            const result = await applyEffect(targetBuffer, "affect");
            await sock.sendMessage(m.chat, {
                image: result,
                caption: `😢 _Affect/Baby by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} AFFECT ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply affect effect`);
        }
    }
};