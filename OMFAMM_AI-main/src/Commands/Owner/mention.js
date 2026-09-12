const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const MENTION_FILE = path.join(__dirname, '../../../database/mention_config.json');

// IMPORTANT: Never reassign this object — always mutate it with Object.assign
// so that the exported reference in handler stays valid across reloads
const mentionConfig = {
    active: false,
    action: '',
    emoji: '❤️‍🔥',
    text: ''
};

const loadMentionConfig = () => {
    try {
        if (fs.existsSync(MENTION_FILE)) {
            Object.assign(mentionConfig, JSON.parse(fs.readFileSync(MENTION_FILE, 'utf8')));
        }
    } catch (e) {
        console.error(`[${BOT_NAME} MENTION] Load error:`, e.message);
    }
};

const saveMentionConfig = () => {
    try {
        fs.mkdirSync(path.dirname(MENTION_FILE), { recursive: true });
        fs.writeFileSync(MENTION_FILE, JSON.stringify(mentionConfig, null, 2));
    } catch (e) {
        console.error(`[${BOT_NAME} MENTION] Save error:`, e.message);
    }
};

loadMentionConfig();

// Helper: normalize JID for comparison
const norm = (j) => (j || '').replace(/:\d+@/, '@').toLowerCase().trim();

module.exports = {
    name: 'mention',
    alias: ['tagme', 'owntag'],
    desc: 'Set action when owner is mentioned in any chat',
    category: 'Owner',
    ownerOnly: true,
    usage: '.mention off |.mention -status |.mention -react <emoji> |.mention -text <message>',

    execute: async (sock, m, { args, reply, prefix }) => {
        const option = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        // OFF
        if (option === 'off') {
            mentionConfig.active = false;
            mentionConfig.action = '';
            saveMentionConfig();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} MENTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Status : OFF
│ ❏ Action : Disabled
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // STATUS
        if (option === 'status' || option === '-status') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} MENTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CURRENT CONFIG*
│ ❏ Active : ${mentionConfig.active? '✓ ON' : '✘ OFF'}
│ ❏ Action : ${mentionConfig.action || 'None'}
│ ❏ Emoji : ${mentionConfig.emoji || '-'}
│ ❏ Text : ${mentionConfig.text || '-'}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // REACT
        if (option === 'react' || option === '-react') {
            if (!value) {
                return reply(`✘ Provide an emoji\n֎ Example: ${prefix}mention -react ❤️‍🔥`);
            }
            mentionConfig.active = true;
            mentionConfig.action = 'react';
            mentionConfig.emoji = value;
            mentionConfig.text = '';
            saveMentionConfig();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} MENTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *UPDATED*
│ ❏ Status : ON
│ ❏ Action : REACT
│ ❏ Emoji : ${value}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // TEXT
        if (option === 'text' || option === '-text') {
            if (!value) {
                return reply(`✘ Provide text\n֎ Example: ${prefix}mention -text Busy, back later`);
            }
            mentionConfig.active = true;
            mentionConfig.action = 'text';
            mentionConfig.text = value;
            mentionConfig.emoji = '';
            saveMentionConfig();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} MENTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *UPDATED*
│ ❏ Status : ON
│ ❏ Action : TEXT
│ ❏ Text : ${value.slice(0, 30)}${value.length > 30? '...' : ''}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // HELP
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} MENTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CONFIGURATION*
│ Configure auto-response when owner is mentioned
│
╭─֎ *COMMANDS*
│ ❏ ${prefix}mention off
│ Disable mention responses
│ ❏ ${prefix}mention -status
│ Show current configuration
│ ❏ ${prefix}mention -react <emoji>
│ Auto-react when mentioned
│ Example: ${prefix}mention -react ❤️‍🔥
│ ❏ ${prefix}mention -text <message>
│ Auto-reply when mentioned
│ Example: ${prefix}mention -text Busy, back later
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};

module.exports.mentionConfig = mentionConfig;
module.exports.loadMentionConfig = loadMentionConfig;
module.exports.norm = norm;
/**
 * Automatic mention-event handler. Enforcement stays in this command module;
 * the central router only calls the exported handler.
 */
module.exports.handleMention = async (sock, m, mek) => {
    if (!mentionConfig.active || !m?.chat) return false;

    const config = require('../../../settings/config');
    const ownerNumber = String(
        process.env.OWNER_NUMBER || config.owner || ''
    ).replace(/[^0-9]/g, '');

    const ownerJid = ownerNumber ? `${ownerNumber}@s.whatsapp.net` : '';
    const botPnJid = (sock.user?.id || '').replace(/:\d+@/, '@s.whatsapp.net');
    const botLid = sock.user?.lid || '';
    const sender = (m.sender || '').replace(/:\d+@/, '@s.whatsapp.net');

    if (!ownerJid || sender === botPnJid) return false;

    const rawMsg = mek?.message || m.message || {};
    const ctxInfo =
        rawMsg.extendedTextMessage?.contextInfo ||
        rawMsg.imageMessage?.contextInfo ||
        rawMsg.videoMessage?.contextInfo ||
        rawMsg.documentMessage?.contextInfo ||
        {};

    const mentions = [
        ...(ctxInfo.mentionedJid || []),
        ...(m.mentionedJid || []),
        ...(m.msg?.contextInfo?.mentionedJid || [])
    ].filter(Boolean);

    const normalized = new Set(mentions.map(norm));
    const matches = [ownerJid, botPnJid, botLid].filter(Boolean).some(jid => normalized.has(norm(jid)));
    if (!matches) return false;

    if (mentionConfig.action === 'react' && mentionConfig.emoji) {
        await sock.sendMessage(m.chat, {
            react: { text: mentionConfig.emoji, key: m.key }
        }).catch(() => {});
        return true;
    }

    if (mentionConfig.action === 'text' && mentionConfig.text) {
        await sock.sendMessage(
            m.chat,
            { text: mentionConfig.text },
            { quoted: m }
        ).catch(() => {});
        return true;
    }

    return false;
};
