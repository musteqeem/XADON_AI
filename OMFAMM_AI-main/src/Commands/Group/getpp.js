const axios = require('axios');

// Helper to extract target from mention or quoted message
function getTarget(m) {
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length) return mentioned[0];
    const quoted = m.quoted;
    if (quoted) return quoted.sender || quoted.participant;
    return null;
}

// Helper to download and send PP
async function downloadAndSend(sock, target, chatToSend, caption = '', quoted = null) {
    try {
        const url = await sock.profilePictureUrl(target, 'image');
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        await sock.sendMessage(chatToSend, {
            image: Buffer.from(res.data),
            caption: caption || `_*@${target.split('@')[0]}*_`,
            mentions: [target]
        }, quoted? { quoted } : {});
        return true;
    } catch {
        return false;
    }
}

module.exports = [
    //.getpp - DM
    {
        name: 'getpp',
        alias: ['pp', 'profilepic'],
        desc: 'Download profile picture to DM',
        category: 'Utils',
        reactions: { start: '😉', success: '✨' },

        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '😉', key: m.key } });
            const target = getTarget(m);
            if (!target) return reply('_*✘ Tag a user or reply to their message!*_\n_*Example:.getpp @user*_');

            const success = await downloadAndSend(sock, target, m.sender, `_*@${target.split('@')[0]}'s Profile Picture*_`);
            if (success) {
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
                await reply('_*✓ Check DM*_');
            } else {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                await reply('_*✘ Could not get profile picture. User may have privacy settings*_');
            }
        }
    },

    //.getppc - Same chat
    {
        name: 'getppc',
        alias: ['ppc', 'pphere', 'profilepichere'],
        desc: 'Download profile picture to this chat',
        category: 'Utils',
        reactions: { start: '😉', success: '✨' },

        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '😉', key: m.key } });
            const target = getTarget(m);
            if (!target) return reply('_*✘ Tag a user or reply to their message!*_\n_*Example:.getppc @user*_');

            const success = await downloadAndSend(sock, target, m.chat, `_*@${target.split('@')[0]}'s Profile Picture*_`, m);
            if (success) {
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            } else {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                await reply('_*✘ Could not get profile picture. User may have privacy settings*_');
            }
        }
    },

    //.getppd - Silent DM
    {
        name: 'getppd',
        alias: ['ppd', 'ppdirect', 'ppdm'],
        desc: 'Download profile picture to DM silently',
        category: 'Utils',
        reactions: { start: '😉', success: '✨' },

        execute: async (sock, m, { reply }) => {
            await sock.sendMessage(m.chat, { react: { text: '😉', key: m.key } });
            const target = getTarget(m);
            if (!target) return reply('_*✘ Tag a user or reply to their message!*_\n_*Example:.getppd @user*_');

            const success = await downloadAndSend(sock, target, m.sender);
            if (success) {
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            } else {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                await reply('_*✘ Could not get profile picture. User may have privacy settings*_');
            }
        }
    }
];