const {
    loadJSON,
    saveJSON
} = require('./_utils');

const DB = 'defense_appeals';

module.exports = {
    name: 'appeal',
    alias: ['appeals'],
    category: 'Defense',
    desc: 'Submit and review moderation appeals',
    usage: '.appeal <reason> | .appeal list | .appeal close <id>',
    groupOnly: false,

    execute: async (sock, m, { args, reply }) => {
        try {
            const db = loadJSON(DB);
            const sub = String(args?.[0] || '').toLowerCase();
            const isAdmin = m.isGroup && (m.isAdmin || m.admin);

            if (sub === 'list') {
                if (!isAdmin) return reply('❌ Admin access required.');

                const entries = Object.entries(db)
                    .filter(([, item]) => item.group === m.chat && item.status === 'open')
                    .slice(-20);

                if (!entries.length) return reply('✅ No open appeals.');

                return reply(entries.map(([id, item]) =>
                    `#${id} — @${item.user.split('@')[0]}\n${item.reason}`
                ).join('\n\n'), {
                    mentions: entries.map(([, item]) => item.user)
                });
            }

            if (sub === 'close') {
                if (!isAdmin) return reply('❌ Admin access required.');

                const id = args?.[1];
                if (!id || !db[id]) return reply('❌ Appeal ID not found.');

                db[id].status = 'closed';
                db[id].closedAt = Date.now();
                saveJSON(DB, db);
                return reply(`✅ Appeal #${id} closed.`);
            }

            const reason = args.join(' ').trim();
            if (!reason) return reply('❌ Usage: .appeal <reason>');

            const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
            db[id] = {
                id,
                group: m.chat,
                user: m.sender,
                reason,
                status: 'open',
                createdAt: Date.now()
            };
            saveJSON(DB, db);

            return reply(`📨 Appeal submitted successfully.\nID: #${id}`);
        } catch (error) {
            console.error('[APPEAL ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
