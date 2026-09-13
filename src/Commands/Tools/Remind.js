const fs = require('fs');
const path = require('path');

const REMINDERS_FILE = path.join(process.cwd(), 'database', 'reminders.json');
const activeReminders = new Map();

function loadReminders() {
    try {
        if (fs.existsSync(REMINDERS_FILE)) {
            return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
        }
    } catch {}
    return {};
}

function saveReminders(data) {
    fs.mkdirSync(path.dirname(REMINDERS_FILE), { recursive: true });
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(data, null, 2));
}

function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)\s*(s|sec|m|min|h|hour|d|day)$/i);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const units = {
        's': 1000, 'sec': 1000,
        'm': 60000, 'min': 60000,
        'h': 3600000, 'hour': 3600000,
        'd': 86400000, 'day': 86400000
    };
    return value * (units[unit] || 60000);
}

function formatTime(ms) {
    if (ms < 60000) return Math.round(ms / 1000) + 's';
    if (ms < 3600000) return Math.round(ms / 60000) + 'm';
    if (ms < 86400000) return Math.round(ms / 3600000) + 'h';
    return Math.round(ms / 86400000) + 'd';
}

module.exports = {
    name: 'remind',
    alias: ['reminder', 'alarm', 'timer'],
    desc: 'Set reminders and get notified',
    category: 'Tools',
    usage: '.remind <time> <message> |.remind list |.remind delete <number>',
    reactions: { start: '⏰', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();
        const sender = m.key.remoteJid;
        const chat = m.chat;
        const db = loadReminders();

        if (!db[sender]) db[sender] = [];
        const reminders = db[sender];

        if (!sub || (sub!== 'list' && sub!== 'delete' &&!parseTime(sub))) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   • PREMIUM REMINDER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}remind <time> <msg>
│ ❏ ${prefix}remind list
│ ❏ ${prefix}remind delete <number>
│
│ ❏ *Time* : 30s, 10m, 2h, 1d
│ ❏ *Example* : ${prefix}remind 10m Call mom
│ ❏ *Active* : ${reminders.length}
╰─────────────────────────╯`
            );
        }

        // LIST
        if (sub === 'list') {
            if (reminders.length === 0) return reply('⏰ No reminders. Use.remind <time> <msg>');

            const table = [['#', 'Time', 'Message']];
            for (const r of reminders) {
                const left = r.time - Date.now();
                const timeLeft = left > 0? formatTime(left) + ' left' : 'DONE';
                const msg = r.text.length > 27? r.text.slice(0, 27) + '...' : r.text;
                table.push(['#' + r.id, timeLeft, msg]);
            }

            await sock.sendMessage(chat, {
                headerText: `## ◈ Reminder Set`,
                contentText: '---',
                title: `◈ Active: ${reminders.length} reminders`,
                table: table,
                footerText: `💡 Use ${prefix}remind delete <number> to cancel`
            }, { quoted: m });
            return;
        }

        // DELETE
        if (sub === 'delete') {
            const id = parseInt(args[1]);
            if (!id) return reply('✘ Provide number:.remind delete 1');

            const index = reminders.findIndex(r => r.id === id);
            if (index === -1) return reply(`✘ Reminder #${id} not found`);

            const key = sender + ':' + id;
            if (activeReminders.has(key)) {
                clearTimeout(activeReminders.get(key));
                activeReminders.delete(key);
            }

            reminders.splice(index, 1);
            db[sender] = reminders;
            saveReminders(db);

            await sock.sendMessage(chat, { react: { text: '🗑️', key: m.key } });
            return reply(`✦ Reminder #${id} cancelled! Remaining: ${reminders.length}`);
        }

        // CREATE REMINDER
        const timeMs = parseTime(sub);
        if (!timeMs) return reply('✘ Invalid time. Use: 30s, 10m, 2h, 1d');

        const message = args.slice(1).join(' ').trim();
        if (!message) return reply('✘ Provide a message:.remind 10m Call mom');

        const newReminder = {
            id: reminders.length + 1,
            text: message,
            time: Date.now() + timeMs,
            chatId: chat,
            created: Date.now()
        };

        reminders.push(newReminder);
        db[sender] = reminders;
        saveReminders(db);

        const reminderKey = sender + ':' + newReminder.id;
        const timeout = setTimeout(async () => {
            try {
                await sock.sendMessage(chat, {
                    text: `⏰ *REMINDER!*\n\n📝 ${message}\n\n_Set ${formatTime(timeMs)} ago_`
                });
                const updated = loadReminders();
                if (updated[sender]) {
                    updated[sender] = updated[sender].filter(r => r.id!== newReminder.id);
                    saveReminders(updated);
                }
                activeReminders.delete(reminderKey);
            } catch {}
        }, timeMs);

        activeReminders.set(reminderKey, timeout);
        await sock.sendMessage(chat, { react: { text: '⏰', key: m.key } });

        await sock.sendMessage(chat, {
            headerText: `## ◈ Reminder Set`,
            contentText: '---',
            title: `Reminder #${newReminder.id}`,
            table: [
                ['Message', message],
                ['Time', formatTime(timeMs)],
                ['Notify At', new Date(newReminder.time).toLocaleTimeString()]
            ],
            footerText: `💡 I will notify you when time is up`
        }, { quoted: m });
    }
};

// Restore reminders on bot start
(function restoreReminders() {
    const db = loadReminders();
    for (const [sender, list] of Object.entries(db)) {
        for (const r of list) {
            const left = r.time - Date.now();
            if (left > 0) {
                const key = sender + ':' + r.id;
                const timeout = setTimeout(async () => {
                    activeReminders.delete(key);
                }, left);
                activeReminders.set(key, timeout);
            }
        }
    }
})();