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

const DB = 'oldantitag';
const WARNS = 'antitag_warns';

function ensure(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            warnLimit: 3,
            minTags: 4,
        };
    }

    return db[group];
}

module.exports = {
    name: 'antitag',
    alias: ['antimention'],
    category: 'Defense',
    desc: 'Block mass mentions and hidden/all-member tagging',
    usage: '.antitag on/off | .antitag min <count> | .antitag delete/warn/kick',
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
                    `🛡️ *ANTI TAG*

` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}
` +
                    `Action: ${cfg.action.toUpperCase()}
` +
                    `Minimum tags: ${cfg.minTags}

` +
                    `• .antitag on/off
` +
                    `• .antitag delete/warn/kick
` +
                    `• .antitag min <number>
` +
                    `• .antitag warncount @user
` +
                    `• .antitag resetwarn @user
` +
                    `• .antitag stats`
                );
            }

            if (sub === 'on' || sub === 'off') {
                cfg.enabled = sub === 'on';
                saveJSON(DB, db);
                return reply(`🛡️ ANTI TAG ${cfg.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (['delete', 'warn', 'kick'].includes(sub)) {
                cfg.action = sub;
                saveJSON(DB, db);
                return reply(`🛡️ Action set to *${sub.toUpperCase()}*.`);
            }

            if (sub === 'min') {
                const value = Number.parseInt(args?.[1], 10);

                if (!Number.isInteger(value) || value < 1 || value > 100) {
                    return reply('❌ Minimum tags must be between 1 and 100.');
                }

                cfg.minTags = value;
                saveJSON(DB, db);
                return reply(`✅ Minimum tags set to ${value}.`);
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
                    `📊 *ANTITAG STATS*

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

            return reply('❌ Unknown option. Use .antitag for the command list.');
        } catch (error) {
            console.error('[ANTITAG ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};

module.exports.handleOldantitag = async function handleOldantitag(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadJSON(DB);
        const cfg = db[m.chat];
        if (!cfg?.enabled) return;

        let detected = (() => { const info = require('./_utils').getContextInfo(m); const mentions = [...new Set([...(m.mentionedJid || []), ...(info.mentionedJid || [])])]; return Boolean(info.mentionAll || info.nonJidMentions || mentions.length >= (cfg.minTags || 4) || /@(all|everyone)\b/i.test(messageText(m))); })();
        if (detected && typeof detected.then === 'function') detected = await detected;
        if (!detected) return;

        const meta = await getGroupInfo(sock, m.chat);
        const sender = senderOf(m);

        if (!meta || !sender || isAdmin(meta, sender)) return;

        await enforce(sock, m, cfg, 'Mass tagging', WARNS);
        console.log(`[DEFENSE][ANTITAG] ${sender} -> ${cfg.action}`);
    } catch (error) {
        console.error('[ANTITAG HANDLER ERROR]', error.message);
    }
};
