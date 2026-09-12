const {
    loadJSON,
    saveJSON,
    messageText,
    getGroupInfo,
    isAdmin,
    senderOf,
    enforce,
    targetFromMessage
} = require('./_utils');

const DB = 'oldantispam';
const WARNS = 'antispam_warns';

function ensure(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            warnLimit: 3,
            limit: 4,
            windowSeconds: 15,
            similarity: 0.82,
        };
    }

    return db[group];
}

module.exports = {
    name: 'antispam',
    alias: ['spamguard'],
    category: 'Defense',
    desc: 'Detect repeated messages and burst spam',
    usage: '.antispam on/off | .antispam limit <count> | .antispam window <seconds>',
    groupOnly: true,
    adminOnly: true,

    execute: async (sock, m, { args, reply }) => {
        try {
            if (!m.isGroup) return reply('❌ This command can only be used in a group.');

            const db = loadJSON(DB);
            const cfg = ensure(db, m.chat);
            saveJSON(DB, db);

            const sub = String(args?.[0] || '').toLowerCase();

            if (!sub) {
                return reply(
                    `🛡️ *ANTI SPAM*

` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}
` +
                    `Action: ${cfg.action.toUpperCase()}
` +
                    `Limit: ${cfg.limit} messages
` +
                    `Window: ${cfg.windowSeconds} seconds

` +
                    `• .antispam on/off
` +
                    `• .antispam delete/warn/kick
` +
                    `• .antispam limit <number>
` +
                    `• .antispam window <seconds>
` +
                    `• .antispam stats`
                );
            }

            if (sub === 'on' || sub === 'off') {
                cfg.enabled = sub === 'on';
                saveJSON(DB, db);
                return reply(`🛡️ ANTI SPAM ${cfg.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (['delete', 'warn', 'kick'].includes(sub)) {
                cfg.action = sub;
                saveJSON(DB, db);
                return reply(`🛡️ Action set to *${sub.toUpperCase()}*.`);
            }

            if (sub === 'limit' || sub === 'window') {
                const value = Number.parseInt(args?.[1], 10);
                const min = sub === 'limit' ? 2 : 5;
                const max = sub === 'limit' ? 20 : 120;

                if (!Number.isInteger(value) || value < min || value > max) {
                    return reply(`❌ Value must be between ${min} and ${max}.`);
                }

                cfg[sub === 'limit' ? 'limit' : 'windowSeconds'] = value;
                saveJSON(DB, db);
                return reply(`✅ ${sub} set to ${value}.`);
            }


            if (sub === 'warncount' || sub === 'resetwarn') {
                const target = targetFromMessage(m, args);
                if (!target) return reply('❌ Mention, quote or provide a phone number.');

                const warns = loadJSON(WARNS);
                const key = `${m.chat}_${target}`;

                if (sub === 'resetwarn') {
                    delete warns[key];
                    saveJSON(WARNS, warns);
                    return reply(`✅ Warnings reset for @${target.split('@')[0]}.`, { mentions: [target] });
                }

                return reply(`⚠️ @${target.split('@')[0]} has ${warns[key]?.count || 0}/${cfg.warnLimit} warnings.`, {
                    mentions: [target]
                });
            }

            if (sub === 'stats') {
                const warns = loadJSON(WARNS);
                const entries = Object.entries(warns)
                    .filter(([key]) => key.startsWith(`${m.chat}_`));
                const total = entries.reduce((sum, [, value]) => sum + (value.count || 0), 0);

                return reply(
                    `📊 *ANTISPAM STATS*

` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}
` +
                    `Action: ${cfg.action.toUpperCase()}
` +
                    `Warned users: ${entries.length}
` +
                    `Total warnings: ${total}`
                );
            }

            return reply('❌ Unknown option. Use .antispam for the command list.');
        } catch (error) {
            console.error('[ANTISPAM ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};

module.exports.handleOldantispam = async function handleOldantispam(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadJSON(DB);
        const cfg = db[m.chat];
        if (!cfg?.enabled) return;

        let detected = require('./_state').recordSpam(m.chat, senderOf(m), messageText(m), cfg.limit || 4, cfg.windowSeconds || 15, cfg.similarity || 0.82);
        if (detected && typeof detected.then === 'function') detected = await detected;
        if (!detected) return;

        const meta = await getGroupInfo(sock, m.chat);
        const sender = senderOf(m);

        if (!meta || !sender || isAdmin(meta, sender)) return;

        await enforce(sock, m, cfg, 'Repeated or burst spam', WARNS);
        console.log(`[DEFENSE][ANTISPAM] ${sender} -> ${cfg.action}`);
    } catch (error) {
        console.error('[ANTISPAM HANDLER ERROR]', error.message);
    }
};
