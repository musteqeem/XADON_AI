const {
    loadJSON,
    saveJSON
} = require('./_utils');

const DB = 'modlog';
const MAX = 200;

function appendLog(group, entry) {
    const db = loadJSON(DB);

    if (!Array.isArray(db[group])) db[group] = [];

    db[group].push({
        ...entry,
        at: Date.now()
    });

    db[group] = db[group].slice(-MAX);
    saveJSON(DB, db);
}

module.exports = {
    name: 'modlog',
    alias: ['moderationlog'],
    category: 'Defense',
    desc: 'View the group moderation audit log',
    usage: '.modlog [count] | .modlog clear',
    groupOnly: true,
    adminOnly: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply('❌ This command can only be used in a group.');

            const db = loadJSON(DB);
            const sub = String(args?.[0] || '').toLowerCase();

            if (sub === 'clear') {
                delete db[m.chat];
                saveJSON(DB, db);
                return reply('✅ Moderation log cleared.');
            }

            const count = Math.min(Math.max(Number.parseInt(args?.[0], 10) || 10, 1), 30);
            const entries = Array.isArray(db[m.chat]) ? db[m.chat].slice(-count).reverse() : [];

            if (!entries.length) return reply('📋 No moderation events recorded.');

            const text = entries.map((entry, index) => {
                const time = new Date(entry.at || Date.now()).toLocaleString();
                return `${index + 1}. ${entry.action || 'event'}\n   User: ${entry.user || 'unknown'}\n   Reason: ${entry.reason || '—'}\n   Time: ${time}`;
            }).join('\n\n');

            return reply(`📋 *MODERATION LOG*\n\n${text}`);
        } catch (error) {
            console.error('[MODLOG ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    },

    appendLog
};

module.exports.handleModLog = async function handleModLog() {};
