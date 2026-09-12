const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const DB_FILE = path.join(__dirname, '../../database/mutedUsers.json');

function ensureDb() {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '{}');
}

function loadDb() {
    ensureDb();
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        return data && typeof data === 'object' ? data : {};
    } catch {
        return {};
    }
}

function saveDb(data) {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function normalizeJid(jid) {
    return String(jid || '').replace(/:\d+(?=@)/, '').toLowerCase();
}

function parseDuration(value) {
    const match = String(value || '').match(/^(\d+)(s|m|h|d|w)$/i);
    if (!match) return null;

    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    const duration = Number(match[1]) * units[match[2].toLowerCase()];
    return duration > 0 && duration <= 30 * 24 * 60 * 60 * 1000 ? duration : null;
}

function formatDuration(ms) {
    if (ms <= 0) return 'expired';
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        days ? `${days}d` : '',
        hours ? `${hours}h` : '',
        minutes ? `${minutes}m` : '',
        secs ? `${secs}s` : ''
    ].filter(Boolean).join(' ');
}

function targetFromMessage(m, args = []) {
    if (m?.mentionedJid?.[0]) return normalizeJid(m.mentionedJid[0]);
    if (m?.quoted?.sender) return normalizeJid(m.quoted.sender);

    const mention = String(m?.text || '').match(/@(\d{5,16})/);
    if (mention) return `${mention[1]}@s.whatsapp.net`;

    const number = String(args[0] || '').replace(/\D/g, '');
    if (number.length >= 7) return `${number}@s.whatsapp.net`;

    return null;
}

function getDisplayName(sock, jid) {
    try {
        const contact = sock.store?.contacts?.get?.(jid);
        return contact?.notify || contact?.name || contact?.verifiedName || jid.split('@')[0];
    } catch {
        return jid.split('@')[0];
    }
}

module.exports = {
    name: 'muteuser',
    alias: ['silence', 'unmuteuser'],
    category: 'Group',
    desc: 'Temporarily delete messages from a selected group member',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    usage: '.muteuser @user [30m] [reason] | .unmuteuser @user',
    reactions: { start: '🔇', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, isAdmin }) => {
        const meta = await sock.groupMetadata(m.chat).catch(() => null);
        if (!meta) return reply('❌ Group metadata is unavailable.');

        const command = String(m.text || '').split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const isUnmute = command === 'unmuteuser';
        const targetJid = targetFromMessage(m, args);

        if (!targetJid) {
            return reply(`❌ Mention, reply to, or provide the number of the user.\nExample: .muteuser @user 30m flooding`);
        }

        const participants = meta.participants || [];
        const target = participants.find(user => normalizeJid(user.id) === normalizeJid(targetJid));
        const targetAdmin = Boolean(target?.admin);
        const sender = normalizeJid(m.sender);
        const groupOwner = normalizeJid(meta.owner);

        if (normalizeJid(targetJid) === sender) return reply('❌ You cannot mute yourself.');
        if (groupOwner && normalizeJid(targetJid) === groupOwner) return reply('❌ The group owner cannot be muted.');
        if (targetAdmin) return reply('❌ Admins cannot be muted by this command.');

        const db = loadDb();
        db[m.chat] ||= {};

        if (isUnmute) {
            if (!db[m.chat][targetJid]) return reply('ℹ️ That user is not muted.');

            delete db[m.chat][targetJid];
            saveDb(db);
            return reply(`🔊 @${targetJid.split('@')[0]} has been unmuted.`, { mentions: [targetJid] });
        }

        const timeArg = args.find(value => /^\d+(s|m|h|d|w)$/i.test(value));
        const duration = parseDuration(timeArg) || (isAdmin ? 60 * 60 * 1000 : 10 * 60 * 1000);
        const reason = args
            .filter(value => value !== timeArg && !value.includes('@') && !/^\d{7,16}$/.test(value))
            .join(' ')
            .trim() || 'No reason provided';

        const until = Date.now() + duration;
        db[m.chat][targetJid] = {
            mutedBy: sender,
            reason,
            createdAt: Date.now(),
            until,
            duration
        };
        saveDb(db);

        return reply(
            `🔇 *USER MUTED*\n\n` +
            `Target: @${targetJid.split('@')[0]}\n` +
            `Duration: ${formatDuration(duration)}\n` +
            `Reason: ${reason}\n` +
            `By: @${sender.split('@')[0]}\n\n` +
            `_Messages from this user will be removed while the mute is active._`,
            { mentions: [targetJid, sender] }
        );
    },

    handleMutedMessage: async (sock, m, isGroup) => {
        if (!isGroup) return false;

        const db = loadDb();
        const chat = db[m.chat];
        const sender = normalizeJid(m.sender);
        const info = chat?.[sender];

        if (!info) return false;

        if (Date.now() >= info.until) {
            delete chat[sender];
            saveDb(db);
            return false;
        }

        try {
            await sock.sendMessage(m.chat, { delete: m.key });
            return true;
        } catch (error) {
            console.error(`[${BOT_NAME} MUTE DELETE ERROR]`, error.message);
            return false;
        }
    },

    isMuted: (chatId, userId) => Boolean(loadDb()?.[chatId]?.[normalizeJid(userId)]),
    getMuteInfo: (chatId, userId) => loadDb()?.[chatId]?.[normalizeJid(userId)] || null
};
