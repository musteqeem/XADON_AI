const fs = require('fs');
const path = require('path');

const DATABASE_DIR = path.join(process.cwd(), 'database');

function databasePath(name) {
    return path.join(DATABASE_DIR, `${name}.json`);
}

function loadJSON(name, fallback = {}) {
    const file = databasePath(name);

    try {
        if (!fs.existsSync(file)) return fallback;
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        console.error(`[DEFENSE DB READ] ${name}:`, error.message);
        return fallback;
    }
}

function saveJSON(name, data) {
    const file = databasePath(name);

    fs.mkdirSync(DATABASE_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function normJid(jid) {
    if (!jid) return '';
    return String(jid).replace(/:\d+@/, '@');
}

function senderOf(m) {
    return normJid(m?.sender || m?.key?.participant || m?.key?.remoteJid);
}

function messageText(m) {
    const msg = m?.message || {};
    return [
        m?.text,
        m?.body,
        msg.conversation,
        msg.extendedTextMessage?.text,
        msg.imageMessage?.caption,
        msg.videoMessage?.caption,
        msg.documentMessage?.caption,
        msg.audioMessage?.caption
    ].filter(value => typeof value === 'string' && value.trim()).join('\n').trim();
}

function getContextInfo(m) {
    const msg = m?.message || {};

    return msg.extendedTextMessage?.contextInfo ||
        msg.imageMessage?.contextInfo ||
        msg.videoMessage?.contextInfo ||
        msg.documentMessage?.contextInfo ||
        msg.audioMessage?.contextInfo ||
        msg.stickerMessage?.contextInfo ||
        msg.contactMessage?.contextInfo ||
        msg.locationMessage?.contextInfo ||
        m?.msg?.contextInfo || {};
}

async function getGroupInfo(sock, group) {
    if (!group || !group.endsWith('@g.us')) return null;
    return sock.groupMetadata(group).catch(() => null);
}

function isAdmin(meta, jid) {
    const target = normJid(jid);

    return Boolean(meta?.participants?.some(participant =>
        normJid(participant.id) === target &&
        (participant.admin === 'admin' || participant.admin === 'superadmin')
    ));
}

function botJids(sock) {
    return [
        sock?.user?.id,
        sock?.user?.lid
    ].filter(Boolean).map(normJid);
}

async function canModerate(sock, m, meta = null) {
    if (!m?.isGroup || m?.key?.fromMe) return false;

    const group = m.chat;
    const sender = senderOf(m);
    const info = meta || await getGroupInfo(sock, group);

    if (!info || !sender) return false;
    if (isAdmin(info, sender)) return false;
    if (botJids(sock).includes(sender)) return false;

    return true;
}

async function deleteMessage(sock, m) {
    if (!m?.key) return false;

    try {
        await sock.sendMessage(m.chat, { delete: m.key });
        return true;
    } catch (error) {
        console.error('[DEFENSE DELETE]', error.message);
        return false;
    }
}

async function warnUser(sock, m, reason, storeName, limit = 3) {
    const db = loadJSON(storeName);
    const group = m.chat;
    const sender = senderOf(m);
    const key = `${group}_${sender}`;

    if (!db[key]) {
        db[key] = {
            user: sender,
            count: 0,
            updatedAt: Date.now()
        };
    }

    db[key].count += 1;
    db[key].updatedAt = Date.now();
    saveJSON(storeName, db);

    const count = db[key].count;

    if (count >= limit) {
        delete db[key];
        saveJSON(storeName, db);

        await sock.sendMessage(group, {
            text: `🛡️ *USER REMOVED*\n\n` +
                `👤 User: @${sender.split('@')[0]}\n` +
                `⚠️ Reason: ${reason}\n` +
                `📊 Warnings: ${limit}/${limit}`,
            mentions: [sender]
        }).catch(() => {});

        await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        return { count, removed: true };
    }

    await sock.sendMessage(group, {
        text: `⚠️ *WARNING*\n\n` +
            `👤 User: @${sender.split('@')[0]}\n` +
            `⚠️ Reason: ${reason}\n` +
            `📊 Warnings: ${count}/${limit}\n` +
            `🔔 Remaining: ${limit - count}`,
        mentions: [sender]
    }).catch(() => {});

    return { count, removed: false };
}

async function enforce(sock, m, config, reason, warnStore) {
    const action = config?.action || 'delete';

    await deleteMessage(sock, m);

    if (action === 'warn') {
        return warnUser(sock, m, reason, warnStore, config.warnLimit || 3);
    }

    if (action === 'kick') {
        const sender = senderOf(m);

        await sock.sendMessage(m.chat, {
            text: `🚫 *USER REMOVED*\n\n` +
                `👤 User: @${sender.split('@')[0]}\n` +
                `⚠️ Reason: ${reason}`,
            mentions: [sender]
        }).catch(() => {});

        await sock.groupParticipantsUpdate(m.chat, [sender], 'remove').catch(() => {});
        return { removed: true };
    }

    const sender = senderOf(m);

    await sock.sendMessage(m.chat, {
        text: `🛡️ *MESSAGE BLOCKED*\n\n` +
            `👤 User: @${sender.split('@')[0]}\n` +
            `⚠️ Reason: ${reason}`,
        mentions: [sender]
    }).catch(() => {});

    return { removed: false };
}

function ensureConfig(db, group, defaults) {
    if (!db[group]) {
        db[group] = { ...defaults };
    } else {
        for (const [key, value] of Object.entries(defaults)) {
            if (db[group][key] === undefined) db[group][key] = value;
        }
    }

    return db[group];
}

function targetFromMessage(m, args = []) {
    let target = m?.mentionedJid?.[0] || m?.quoted?.sender;

    if (!target && args[1]) {
        const number = String(args[1]).replace(/[^0-9]/g, '');

        if (number) target = `${number}@s.whatsapp.net`;
    }

    return normJid(target);
}

module.exports = {
    databasePath,
    loadJSON,
    saveJSON,
    normJid,
    senderOf,
    messageText,
    getContextInfo,
    getGroupInfo,
    isAdmin,
    canModerate,
    deleteMessage,
    warnUser,
    enforce,
    ensureConfig,
    targetFromMessage
};
