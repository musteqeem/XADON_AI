const { fetchGifUrl, reactionConfig } = require('../Core/ⓘ.js');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

function createReactionCommand(name, config) {
    return {
        name: name,
        alias: [name],
        category: 'fun',
        desc: config.description || `Send ${name} reaction`,
        usage: `.${name} [@user]`,

        execute: async (sock, m, { reply }) => {
            try {
                const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const senderName = m.pushName || 'Someone';
                const target = mentionedJid.length > 0? '@' + mentionedJid[0].split('@')[0] : null;

                let caption, canSend = true;

                if (config.needTarget) {
                    if (target) {
                        caption = config.msgTarget(senderName, target);
                    } else {
                        caption = config.msgNoTarget;
                        canSend = false;
                    }
                } else {
                    caption = config.msgSelf(senderName);
                }

                if (!canSend) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *${BOT_NAME} REACTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE GUIDE*
│ ❏ Command :.${name} @user
│ ❏ Example :.${name} @2347079056039
╰─────────────────────────╯
${caption}`
                );

                const gifUrl = await fetchGifUrl(name + ' anime');
                if (!gifUrl) return reply(`⚠ GIF not found\n*Contact:* 2347079056039`);

                await sock.sendMessage(m.key.remoteJid, {
                    video: { url: gifUrl },
                    gifPlayback: true,
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${BOT_NAME}*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n${caption}\n\n_Powered by ${BOT_NAME}_`,
                    mentions: mentionedJid
                }, { quoted: m });

            } catch (err) {
                console.error(`Reaction Error (${name}):`, err.message);
                reply(`✘ Reaction failed.\n*Support:* 2347079056039`);
            }
        }
    };
}

const allReactions = Object.entries(reactionConfig).map(([name, config]) => createReactionCommand(name, config));

module.exports = allReactions;