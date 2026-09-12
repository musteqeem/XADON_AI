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

const DB = 'antighost';
const WARNS = 'antighost_warns';

function ensure(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            warnLimit: 3,
            rejectUnknown: true,
        };
    }

    return db[group];
}

module.exports = {
    name: 'antighost',
    alias: ['ghostguard'],
    category: 'Defense',
    desc: 'Block messages from participants no longer present in the group',
    usage: '.antighost on/off | .antighost delete/warn/kick',
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
                    `🛡️ *ANTI GHOST*

` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}
` +
                    `Action: ${cfg.action.toUpperCase()}

` +
                    `• .antighost on/off
` +
                    `• .antighost delete/warn/kick
` +
                    `• .antighost warncount @user
` +
                    `• .antighost resetwarn @user
` +
                    `• .antighost stats`
                );
            }

            if (sub === 'on' || sub === 'off') {
                cfg.enabled = sub === 'on';
                saveJSON(DB, db);
                return reply(`🛡️ ANTI GHOST ${cfg.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (['delete', 'warn', 'kick'].includes(sub)) {
                cfg.action = sub;
                saveJSON(DB, db);
                return reply(`🛡️ Action set to *${sub.toUpperCase()}*.`);
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
                    `📊 *ANTIGHOST STATS*

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

            return reply('❌ Unknown option. Use .antighost for the command list.');
        } catch (error) {
            console.error('[ANTIGHOST ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};

module.exports.handleAntighost = async function handleAntighost(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadJSON(DB);
        const cfg = db[m.chat];
        if (!cfg?.enabled) return;

        let detected = (async () => { const meta = await getGroupInfo(sock, m.chat); const sender = senderOf(m); return Boolean(meta && sender && !meta.participants.some(p => require('./_utils').normJid(p.id) === sender)); })();
        if (detected && typeof detected.then === 'function') detected = await detected;
        if (!detected) return;

        const meta = await getGroupInfo(sock, m.chat);
        const sender = senderOf(m);

        if (!meta || !sender || isAdmin(meta, sender)) return;

        await enforce(sock, m, cfg, 'Unknown group participant', WARNS);
        console.log(`[DEFENSE][ANTIGHOST] ${sender} -> ${cfg.action}`);
    } catch (error) {
        console.error('[ANTIGHOST HANDLER ERROR]', error.message);
    }
};
