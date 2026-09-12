const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../database/mutedStickers.json');

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

function normalize(jid) {
    return String(jid || '').replace(/:\d+(?=@)/, '').toLowerCase();
}

function parseDuration(value) {
    const match = String(value || '').match(/^(\d+)(s|m|h|d|w)$/i);
    if (!match) return null;
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
    const ms = Number(match[1]) * units[match[2].toLowerCase()];
    return ms > 0 && ms <= 30 * 86400000 ? ms : null;
}

function targetFromMessage(m, args = []) {
    if (m?.mentionedJid?.[0]) return normalize(m.mentionedJid[0]);
    if (m?.quoted?.sender) return normalize(m.quoted.sender);
    const mention = String(m?.text || '').match(/@(\d{5,16})/);
    if (mention) return `${mention[1]}@s.whatsapp.net`;
    const number = String(args[0] || '').replace(/\D/g, '');
    return number.length >= 7 ? `${number}@s.whatsapp.net` : null;
}

module.exports = {
    name: 'mutesticker',
    alias: ['stickerban', 'unmutesticker', 'nosticker'],
    category: 'Group',
    desc: 'Temporarily prevent a group member from sending stickers',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    usage: '.mutesticker @user [30m] [reason] | .unmutesticker @user',
    reactions: { start: '🔇', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const meta = await sock.groupMetadata(m.chat).catch(() => null);
        if (!meta) return reply('❌ Group metadata is unavailable.');

        const command = String(m.text || '').split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const isUnmute = command === 'unmutesticker';
        const targetJid = targetFromMessage(m, args);
        if (!targetJid) return reply('❌ Mention, reply to, or provide the user number.');

        const participant = (meta.participants || []).find(user => normalize(user.id) === normalize(targetJid));
        if (participant?.admin) return reply('❌ Admins cannot be sticker-muted by this command.');

        const db = loadDb();
        db[m.chat] ||= {};

        if (isUnmute) {
            if (!db[m.chat][targetJid]) return reply('ℹ️ That user is not sticker-muted.');
            delete db[m.chat][targetJid];
            saveDb(db);
            return reply(`🔊 @${targetJid.split('@')[0]} can send stickers again.`, { mentions: [targetJid] });
        }

        const timeArg = args.find(value => /^\d+(s|m|h|d|w)$/i.test(value));
        const duration = parseDuration(timeArg) || 60 * 60 * 1000;
        const reason = args
            .filter(value => value !== timeArg && !value.includes('@') && !/^\d{7,16}$/.test(value))
            .join(' ').trim() || 'No reason provided';

        db[m.chat][targetJid] = {
            mutedBy: normalize(m.sender),
            reason,
            createdAt: Date.now(),
            until: Date.now() + duration,
            duration
        };
        saveDb(db);

        return reply(
            `🔇 *STICKER MUTE*\n\nTarget: @${targetJid.split('@')[0]}\nDuration: ${formatDuration(duration)}\nReason: ${reason}`,
            { mentions: [targetJid] }
        );
    },

    handleMutedSticker: async (sock, m, isGroup) => {
        if (!isGroup || m.mtype !== 'stickerMessage') return false;

        const db = loadDb();
        const info = db[m.chat]?.[normalize(m.sender)];
        if (!info) return false;

        if (Date.now() >= info.until) {
            delete db[m.chat][normalize(m.sender)];
            saveDb(db);
            return false;
        }

        try {
            await sock.sendMessage(m.chat, { delete: m.key });
            return true;
        } catch (error) {
            console.error('[STICKER MUTE DELETE ERROR]', error.message);
            return false;
        }
    }
};

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, secs && `${secs}s`]
        .filter(Boolean).join(' ');
}
