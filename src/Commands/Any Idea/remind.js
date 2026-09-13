const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../database/reminders.json');
const timers = new Map();

module.exports = {
    name: 'remind',
    alias: ['reminder', 'remindme'],
    category: 'ANY IDEA',
    desc: 'Create a persistent reminder for a chat',
    usage: '.remind <10m|2h|1d> <message> | .remind list | .remind cancel <id>',
    reactions: { start: '⏰', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const action = String(args[0] || '').toLowerCase();

        if (action === 'list') {
            const items = load().filter(item => item.chat === m.chat && item.dueAt > Date.now());
            if (!items.length) return reply('⏰ No active reminders in this chat.');

            return reply(
                `⏰ *REMINDERS*\n\n${items.map(item =>
                    `• *${item.id}* — ${formatRemaining(item.dueAt - Date.now())}\n  ${item.text}`
                ).join('\n\n')}`
            );
        }

        if (action === 'cancel') {
            const id = args[1];
            if (!id) return reply('Usage: .remind cancel <id>');

            const db = load();
            const index = db.findIndex(item => item.id === id && item.chat === m.chat);
            if (index === -1) return reply('❌ Reminder not found.');

            clearTimer(id);
            db.splice(index, 1);
            save(db);
            return reply(`✅ Reminder *${id}* cancelled.`);
        }

        const duration = parseDuration(args[0]);
        const text = args.slice(1).join(' ').trim();
        if (!duration || !text) {
            return reply(
                '⏰ *REMINDER*\n\n' +
                'Usage: .remind <duration> <message>\n' +
                'Example: .remind 30m check the download\n' +
                'Units: s, m, h, d, w'
            );
        }

        const db = load();
        const id = createId(db);
        const reminder = {
            id,
            chat: m.chat,
            sender: m.sender,
            text: text.slice(0, 1000),
            createdAt: Date.now(),
            dueAt: Date.now() + duration
        };

        db.push(reminder);
        save(db);
        schedule(sock, reminder);

        return reply(`⏰ Reminder *${id}* set for ${formatRemaining(duration)} from now.`);
    },

    setupReminders: setupReminders
};

function ensureDb() {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
}

function load() {
    ensureDb();
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function save(data) {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function parseDuration(value) {
    const match = String(value || '').match(/^(\d{1,6})(s|m|h|d|w)$/i);
    if (!match) return null;
    const amount = Number(match[1]);
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
    const ms = amount * units[match[2].toLowerCase()];
    return ms > 0 && ms <= 24 * 24 * 60 * 60 * 1000 ? ms : null;
}

function formatRemaining(ms) {
    let seconds = Math.max(1, Math.ceil(ms / 1000));
    const days = Math.floor(seconds / 86400); seconds %= 86400;
    const hours = Math.floor(seconds / 3600); seconds %= 3600;
    const minutes = Math.floor(seconds / 60); seconds %= 60;
    return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`, seconds && `${seconds}s`]
        .filter(Boolean).join(' ');
}

function createId(db) {
    let id;
    do id = Math.random().toString(36).slice(2, 8).toUpperCase();
    while (db.some(item => item.id === id));
    return id;
}

function clearTimer(id) {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
}

function schedule(sock, reminder) {
    clearTimer(reminder.id);
    const delay = Math.max(0, reminder.dueAt - Date.now());

    const timer = setTimeout(async () => {
        try {
            await sock.sendMessage(reminder.chat, {
                text: `⏰ *REMINDER ${reminder.id}*\n\n${reminder.text}`,
                mentions: reminder.sender ? [reminder.sender] : []
            });
        } catch (error) {
            console.error('[REMINDER SEND ERROR]', error.message);
        }

        const db = load().filter(item => item.id !== reminder.id);
        save(db);
        timers.delete(reminder.id);
    }, Math.min(delay, 2147483647));

    timers.set(reminder.id, timer);
}

function setupReminders(sock) {
    for (const reminder of load()) {
        if (reminder.dueAt <= Date.now()) continue;
        schedule(sock, reminder);
    }
}

module.exports.setupReminders = setupReminders;
