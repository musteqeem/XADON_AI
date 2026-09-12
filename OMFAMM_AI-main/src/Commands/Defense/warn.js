const {
    loadJSON,
    saveJSON,
    targetFromMessage,
    getGroupInfo,
    isAdmin,
    normJid
} = require('./_utils');

const DB = 'defense_warns';
const LIMIT = 3;

module.exports = {
    name: 'warn',
    alias: ['warning'],
    category: 'Defense',
    desc: 'Issue, inspect and reset persistent group warnings',
    usage: '.warn @user [reason] | .warn count @user | .warn reset @user | .warn list',
    groupOnly: true,
    adminOnly: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply('❌ This command can only be used in a group.');

            const db = loadJSON(DB);
            const sub = String(args?.[0] || '').toLowerCase();

            if (sub === 'list') {
                const entries = Object.entries(db)
                    .filter(([key]) => key.startsWith(`${m.chat}_`))
                    .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
                    .slice(0, 20);

                if (!entries.length) return reply('✅ No active warnings.');

                const mentions = [];
                const lines = entries.map(([key, value], index) => {
                    const user = value.user || key.split('_').slice(1).join('_');
                    mentions.push(user);
                    return `${index + 1}. @${user.split('@')[0]} — ${value.count}/${LIMIT}`;
                });

                return reply(`⚠️ *WARNINGS*\n\n${lines.join('\n')}`, { mentions });
            }

            const target = targetFromMessage(m, args);

            if (sub === 'count') {
                if (!target) return reply('❌ Mention, quote or provide a phone number.');
                const record = db[`${m.chat}_${target}`];
                return reply(`⚠️ @${target.split('@')[0]}: ${record?.count || 0}/${LIMIT} warnings.`, {
                    mentions: [target]
                });
            }

            if (sub === 'reset') {
                if (!target) return reply('❌ Mention, quote or provide a phone number.');
                delete db[`${m.chat}_${target}`];
                saveJSON(DB, db);
                return reply(`✅ Warnings reset for @${target.split('@')[0]}.`, { mentions: [target] });
            }

            if (!target) return reply('❌ Mention or quote the participant you want to warn.');

            const meta = await getGroupInfo(sock, m.chat);
            if (!meta || isAdmin(meta, target)) return reply('❌ That participant cannot be warned.');

            const reason = args.slice(1).join(' ').trim() || 'Group rule violation';
            const key = `${m.chat}_${normJid(target)}`;
            const record = db[key] || { user: normJid(target), count: 0, history: [] };

            record.count += 1;
            record.history.push({ reason, at: Date.now() });
            record.history = record.history.slice(-10);
            db[key] = record;

            if (record.count >= LIMIT) {
                delete db[key];
                saveJSON(DB, db);

                await sock.sendMessage(m.chat, {
                    text: `🚫 *USER REMOVED*\n\n@${target.split('@')[0]} reached ${LIMIT}/${LIMIT} warnings.\nReason: ${reason}`,
                    mentions: [target]
                });
                await sock.groupParticipantsUpdate(m.chat, [target], 'remove').catch(() => {});
                return;
            }

            saveJSON(DB, db);

            return reply(
                `⚠️ *WARNING ISSUED*\n\n` +
                `User: @${target.split('@')[0]}\n` +
                `Reason: ${reason}\n` +
                `Count: ${record.count}/${LIMIT}`,
                { mentions: [target] }
            );
        } catch (error) {
            console.error('[WARN ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};
