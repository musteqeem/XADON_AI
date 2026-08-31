const { applyEffect } = require("../Core/,,.js");
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "wanted",
    alias: ["poster", "criminal"],
    category: "Media",
    desc: "Apply wanted poster effect to an image or a user's profile picture",
    usage: ".wanted [@user] or reply to an image",
    examples: [".wanted", ".wanted @2347043550282", "reply to image +.wanted"],
    reactions: { start: '🚨', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        let targetBuffer = null;

        // 1) Reply to image
        if (m.quoted && m.quoted.mtype?.includes("image")) {
            targetBuffer = await m.quoted.download();
        }
        // 2) Mention / Quote / Number
        else {
            let targetJid = null;

            if (m.mentionedJid && m.mentionedJid.length > 0) {
                targetJid = m.mentionedJid[0];
            } else if (m.quoted && m.quoted.sender) {
                targetJid = m.quoted.sender;
            } else if (args[0]) {
                const number = args[0].replace(/[^0-9]/g, '');
                if (number.length >= 10) {
                    targetJid = `${number}@s.whatsapp.net`;
                }
            }

            if (targetJid) {
                try {
                    const ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                    const response = await fetch(ppUrl);
                    targetBuffer = Buffer.from(await response.arrayBuffer());
                } catch (err) {
                    return reply(`✘ Could not fetch profile picture for @${targetJid.split('@')[0]}\nReason: Private or no profile picture`);
                }
            }
        }

        if (!targetBuffer) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} WANTED EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}wanted
│ ❏ ${prefix}wanted @mention
│ ❏ ${prefix}wanted <number>
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🚨', key: m.key } });

        try {
            const result = await applyEffect(targetBuffer, "wanted");
            await sock.sendMessage(m.chat, {
                image: result,
                mimetype: "image/png",
                caption: `🚨 _WANTED by ${BOT_NAME}_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} WANTED ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to apply wanted effect`);
        }
    }
};