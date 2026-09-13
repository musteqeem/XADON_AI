const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const AFK_FILE = path.join(process.cwd(), 'database', 'afk.json');
const MARKER = '\u200E';

let afkData = {};

// ── Normalize JID to phone format consistently ──────────────────────────────
const normalizeJid = (jid) => (jid || '').replace(/:\d+@/, '@').toLowerCase().trim();

// ── Build storage key — always use normalized JID ───────────────────────────
const makeKey = (userId, chatId) => `${normalizeJid(userId)}_${chatId}`;

const loadAfk = () => {
    try {
        if (fs.existsSync(AFK_FILE)) {
            afkData = JSON.parse(fs.readFileSync(AFK_FILE, 'utf8'));
        }
    } catch (e) {
        console.error(`[${BOT_NAME} AFK LOAD]`, e.message);
        afkData = {};
    }
};

const saveAfk = () => {
    try {
        fs.writeFileSync(AFK_FILE, JSON.stringify(afkData, null, 2));
    } catch (e) {
        console.error(`[${BOT_NAME} AFK SAVE]`, e.message);
    }
};

loadAfk();

module.exports = {
    name: 'afk',
    alias: ['away'],
    desc: 'Set AFK with optional reason',
    category: 'General',
    usage: '.afk [reason] |.afk off',

    execute: async (sock, m, { args, reply }) => {
        const userId = (sock.user?.id || m.sender || '').replace(/:\d+@/, '@s.whatsapp.net');
        const chatId = m.chat;
        const key = makeKey(userId, chatId);
        const sub = args[0]?.toLowerCase();

        // Turn off
        if (sub === 'off') {
            const wasActive = afkData[key] && afkData[key].enabled;
            if (wasActive) delete afkData[key];
            saveAfk();
            return reply(
                wasActive
               ? `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${BOT_NAME} AFK*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n✓ AFK Disabled\nWelcome back!` + MARKER
                : `✘ You were not AFK` + MARKER
            );
        }

        // Turn on with reason
        const reason = args.join(' ') || 'AFK';
        afkData[key] = {
            enabled: true,
            reason: reason,
            timestamp: Date.now(),
            mentions: 0
        };
        saveAfk();

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AFK*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Status : ACTIVE
│ ❏ Reason : ${reason}
│ ❏ Tip : Send any message to turn off
╰─────────────────────────╯
_Powered by ${BOT_NAME}_` + MARKER
        );
    }
};

// ── Public helper functions ──────────────────────────────────────────────────

module.exports.getAfk = (userId, chatId) => {
    const record = afkData[makeKey(userId, chatId)];
    return (record && record.enabled === true)? record : null;
};

module.exports.disableAfk = (userId, chatId) => {
    const key = makeKey(userId, chatId);
    if (afkData[key]) {
        delete afkData[key];
        saveAfk();
        return true;
    }
    return false;
};

module.exports.incrementMention = (userId, chatId) => {
    const key = makeKey(userId, chatId);
    if (afkData[key] && afkData[key].enabled) {
        afkData[key].mentions = (afkData[key].mentions || 0) + 1;
        saveAfk();
    }
};

module.exports.getAllAfkUsers = (chatId) => {
    const users = [];
    for (const key in afkData) {
        if (key.endsWith(`_${chatId}`) && afkData[key]?.enabled === true) {
            const userId = key.slice(0, key.lastIndexOf(`_${chatId}`));
            users.push(userId);
        }
    }
    return users;
};

// ── AFK Mention Detection ────────────────────────────────────────────────────
module.exports.isAfkUserMentioned = (m, mek, sock) => {
    const rawMsg = mek?.message || {};
    const ctxInfo = rawMsg.extendedTextMessage?.contextInfo ||
                    rawMsg.imageMessage?.contextInfo ||
                    rawMsg.videoMessage?.contextInfo ||
                    rawMsg.documentMessage?.contextInfo || {};

    const norm = (j) => (j || '').replace(/:\d+@/, '@').toLowerCase().trim();

    const allMentions = [
       ...(ctxInfo.mentionedJid || []),
       ...(m.mentionedJid || []),
       ...(m.msg?.contextInfo?.mentionedJid || []),
    ];
    const uniqueMentions = [...new Set(allMentions)].filter(Boolean);

    const allText = [
        rawMsg.conversation,
        rawMsg.extendedTextMessage?.text,
        rawMsg.imageMessage?.caption,
        rawMsg.videoMessage?.caption,
        m.text,
        m.body
    ].filter(Boolean).join(' ');

    const botPnJid = (sock.user?.id || '').replace(/:\d+@/, '@s.whatsapp.net');
    const botLid = sock.user?.lid || '';

    const afkUsers = module.exports.getAllAfkUsers(m.chat);

    for (const afkUser of afkUsers) {
        const afkNumber = afkUser.split('@')[0].replace(/[^0-9]/g, '');
        let isMentioned = false;

        for (const jid of uniqueMentions) {
            const normalized = norm(jid);
            if (normalized === norm(afkUser) || normalized === norm(botPnJid)) {
                isMentioned = true; break;
            }
            if (botLid && normalized === norm(botLid)) {
                isMentioned = true; break;
            }
            try {
                const decoded = sock.decodeJid(jid);
                if (decoded && norm(decoded) === norm(afkUser)) { isMentioned = true; break; }
            } catch {}
            const participantAlt = ctxInfo.participantAlt || m.msg?.contextInfo?.participantAlt;
            if (participantAlt && norm(participantAlt) === norm(afkUser)) { isMentioned = true; break; }
        }

        if (!isMentioned) {
            const quotedParticipant = ctxInfo.participant || '';
            if (quotedParticipant) {
                const qNorm = norm(quotedParticipant);
                if (
                    qNorm === norm(afkUser) ||
                    qNorm === norm(botPnJid) ||
                    (botLid && qNorm === norm(botLid))
                ) {
                    isMentioned = true;
                } else {
                    try {
                        const decoded = sock.decodeJid(quotedParticipant);
                        if (decoded && norm(decoded) === norm(afkUser)) isMentioned = true;
                    } catch {}
                    if (!isMentioned) {
                        const participantAlt = ctxInfo.participantAlt || m.msg?.contextInfo?.participantAlt;
                        if (participantAlt && norm(participantAlt) === norm(afkUser)) isMentioned = true;
                    }
                }
            }
        }

        if (!isMentioned) {
            const waLink1 = `wa.me/${afkNumber}`;
            const waLink2 = `https://wa.me/${afkNumber}`;
            const waLink3 = `https://api.whatsapp.com/send?phone=${afkNumber}`;
            isMentioned =
                allText.includes(afkNumber) ||
                allText.includes(`@${afkNumber}`) ||
                allText.includes(afkUser) ||
                allText.includes(waLink1) ||
                allText.includes(waLink2) ||
                allText.includes(waLink3);
        }

        if (isMentioned) return afkUser;
    }

    return null;
};

module.exports.loadAfk = loadAfk;
module.exports.saveAfk = saveAfk;
module.exports.MARKER = MARKER;
/**
 * Message-event handler. The central message router only invokes this method;
 * AFK state and response logic stay inside the AFK command module.
 */
module.exports.handleAfkMessage = async (sock, m, mek) => {
    if (!m?.chat || m.mtype === 'reactionMessage') return false;

    const marker = module.exports.MARKER;
    if (m.body && m.body.includes(marker)) return false;

    const botJid = (sock.user?.id || '').replace(/:\d+@/, '@s.whatsapp.net');

    if (m.key?.fromMe && module.exports.disableAfk(botJid, m.chat)) {
        await sock.sendMessage(
            m.chat,
            { text: `✨ Welcome back!${marker}` },
            { quoted: m }
        ).catch(() => {});
    }

    const afkUser = module.exports.isAfkUserMentioned(m, mek, sock);
    if (!afkUser || afkUser === m.sender) return false;

    const data = module.exports.getAfk(afkUser, m.chat);
    if (!data) return false;

    const elapsed = Date.now() - data.timestamp;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeAgo;
    if (days > 0) timeAgo = `${days}d ${hours % 24}h`;
    else if (hours > 0) timeAgo = `${hours}h ${minutes % 60}m`;
    else timeAgo = `${minutes}m`;

    const notice =
        `╭─֎ *AFK NOTICE* 𓉤\n` +
        `│\n` +
        `│ 𓃼 @${afkUser.split('@')[0]}\n` +
        `│ ⓘ Reason : ${data.reason}\n` +
        `│ 𓄄 Last seen : ${timeAgo} ago\n` +
        `│ ✐ Mentions : ${data.mentions || 0}\n` +
        `╰──────────────────`;

    await sock.sendMessage(
        m.chat,
        { text: notice + marker, mentions: [afkUser] },
        { quoted: m }
    );

    module.exports.incrementMention(afkUser, m.chat);
    return true;
};
