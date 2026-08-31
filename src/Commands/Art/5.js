const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "wasted",
    alias: ["waste", "rip"],
    desc: "Apply GTA Wasted effect to user profile picture",
    category: "Fun",
    usage: ".wasted @user or reply to a message",
    examples: [".wasted", ".wasted @2347043550282", "reply to user +.wasted"],
    cooldown: 5,
    reactions: { start: '💀', success: '☠️', error: '✘' },

    execute: async (sock, m, { args, reply }) => {
        const chat = m.chat;
        let targetJid;

        // 1) Mentioned user
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            targetJid = m.mentionedJid[0];
        }
        // 2) Quoted message sender
        else if (m.quoted?.sender) {
            targetJid = m.quoted.sender;
        }
        // 3) Reply to quoted message participant
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetJid) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} WASTED EFFECT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.wasted @user
│ ❏ Reply to a message +.wasted
│
╭─֎ *INFO*
│ ❏ Applies GTA Wasted effect to PFP
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // Prevent self-waste
        const botJid = sock.user.id.replace(/:\d+@/, '@s.whatsapp.net');
        if (targetJid === botJid) {
            return reply(`⚉ Nice try! I can't waste myself 😎`);
        }

        await sock.sendMessage(chat, { react: { text: '💀', key: m.key } }).catch(() => {});

        try {
            let avatarUrl;
            try {
                avatarUrl = await sock.profilePictureUrl(targetJid, 'image');
            } catch {
                avatarUrl = 'https://i.imgur.com/2wzGhpF.jpeg'; // default avatar
            }

            const apiUrl = `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(avatarUrl)}`;
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 15000
            });

            const targetName = targetJid.split('@')[0];
            const caption =
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *W A S T E D* 💀
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RESULT*
│ ❏ Target : @${targetName}
│ ❏ Status : Rest in pieces!
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`;

            await sock.sendMessage(chat, {
                image: Buffer.from(response.data),
                caption: caption,
                mentions: [targetJid]
            }, { quoted: m });

            await sock.sendMessage(chat, { react: { text: '☠️', key: m.key } }).catch(() => {});

        } catch (err) {
            console.error(`[${BOT_NAME} WASTED ERROR]`, err);
            await sock.sendMessage(chat, { react: { text: '✘', key: m.key } }).catch(() => {});
            return reply(`✘ Failed to create wasted image: ${err.message || 'API error'}`);
        }
    }
};