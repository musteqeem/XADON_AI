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

const DB = 'antiflood';
const WARNS = 'antiflood_warns';

function ensure(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            warnLimit: 3,
            limit: 6,
            windowSeconds: 8,
        };
    }

    return db[group];
}

module.exports = {
    name: 'antiflood',
    alias: ['flood'],
    category: 'Defense',
    desc: 'Detect rapid message bursts from a single participant',
    usage: '.antiflood on/off | .antiflood limit <count> | .antiflood window <seconds>',
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
                    `🛡️ *ANTI FLOOD*

` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}
` +
                    `Action: ${cfg.action.toUpperCase()}
` +
                    `Limit: ${cfg.limit} messages
` +
                    `Window: ${cfg.windowSeconds} seconds

` +
                    `• .antiflood on/off
` +
                    `• .antiflood delete/warn/kick
` +
                    `• .antiflood limit <number>
` +
                    `• .antiflood window <seconds>
` +
                    `• .antiflood stats`
                );
            }

            if (sub === 'on' || sub === 'off') {
                cfg.enabled = sub === 'on';
                saveJSON(DB, db);
                return reply(`🛡️ ANTI FLOOD ${cfg.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (['delete', 'warn', 'kick'].includes(sub)) {
                cfg.action = sub;
                saveJSON(DB, db);
                return reply(`🛡️ Action set to *${sub.toUpperCase()}*.`);
            }

            if (sub === 'limit' || sub === 'window') {
                const value = Number.parseInt(args?.[1], 10);
                const min = sub === 'limit' ? 2 : 2;
                const max = sub === 'limit' ? 30 : 120;

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
                    `📊 *ANTIFLOOD STATS*

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

            return reply('❌ Unknown option. Use .antiflood for the command list.');
        } catch (error) {
            console.error('[ANTIFLOOD ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};

module.exports.handleAntiflood = async function handleAntiflood(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadJSON(DB);
        const cfg = db[m.chat];
        if (!cfg?.enabled) return;

        let detected = require('./_state').recordFlood(m.chat, senderOf(m), cfg.limit || 6, cfg.windowSeconds || 8);
        if (detected && typeof detected.then === 'function') detected = await detected;
        if (!detected) return;

        const meta = await getGroupInfo(sock, m.chat);
        const sender = senderOf(m);

        if (!meta || !sender || isAdmin(meta, sender)) return;

        await enforce(sock, m, cfg, 'Message flooding', WARNS);
        console.log(`[DEFENSE][ANTIFLOOD] ${sender} -> ${cfg.action}`);
    } catch (error) {
        console.error('[ANTIFLOOD HANDLER ERROR]', error.message);
    }
};
