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

const DB = 'oldantiword';
const WARNS = 'antiword_warns';

function ensure(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            warnLimit: 3,
            words: []
        };
    }

    return db[group];
}

function findBannedWord(text, words) {
    const normalized = text.toLowerCase();

    for (const word of words) {
        const clean = String(word).trim().toLowerCase();
        if (!clean) continue;

        const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');

        if (pattern.test(normalized)) return clean;
    }

    return null;
}

module.exports = {
    name: 'antiword',
    alias: ['wordfilter'],
    category: 'Defense',
    desc: 'Block configured words with delete, warning or removal actions',
    usage: '.antiword on/off | .antiword add <word> | .antiword remove <word>',
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
                    `🛡️ *ANTI WORD*\n\n` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}\n` +
                    `Action: ${cfg.action.toUpperCase()}\n` +
                    `Words: ${cfg.words.length}\n\n` +
                    `• .antiword on/off\n` +
                    `• .antiword delete/warn/kick\n` +
                    `• .antiword add <word>\n` +
                    `• .antiword remove <word>\n` +
                    `• .antiword list\n` +
                    `• .antiword warncount @user\n` +
                    `• .antiword resetwarn @user\n` +
                    `• .antiword stats`
                );
            }

            if (sub === 'on' || sub === 'off') {
                cfg.enabled = sub === 'on';
                saveJSON(DB, db);
                return reply(`🛡️ Anti Word ${cfg.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (['delete', 'warn', 'kick'].includes(sub)) {
                cfg.action = sub;
                saveJSON(DB, db);
                return reply(`🛡️ Anti Word action set to *${sub.toUpperCase()}*.`);
            }

            if (sub === 'add') {
                const words = args.slice(1).map(x => x.trim().toLowerCase()).filter(Boolean);

                if (!words.length) return reply('❌ Usage: .antiword add <word1> <word2>');

                for (const word of words) {
                    if (!cfg.words.includes(word)) cfg.words.push(word);
                }

                saveJSON(DB, db);
                return reply(`✅ Added ${words.length} word rule(s).`);
            }

            if (sub === 'remove') {
                const word = String(args?.[1] || '').trim().toLowerCase();
                if (!word) return reply('❌ Usage: .antiword remove <word>');

                cfg.words = cfg.words.filter(item => item !== word);
                saveJSON(DB, db);
                return reply(`✅ Removed word rule: ${word}`);
            }

            if (sub === 'list') {
                return reply(
                    `🛡️ *BANNED WORDS*\n\n` +
                    (cfg.words.length ? cfg.words.map((word, index) => `${index + 1}. ${word}`).join('\n') : 'No words configured.')
                );
            }

            if (sub === 'clear') {
                cfg.words = [];
                saveJSON(DB, db);
                return reply('✅ Anti Word list cleared.');
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
                const entries = Object.entries(warns).filter(([key]) => key.startsWith(`${m.chat}_`));
                const total = entries.reduce((sum, [, value]) => sum + (value.count || 0), 0);

                return reply(
                    `📊 *ANTI WORD STATS*\n\n` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}\n` +
                    `Action: ${cfg.action.toUpperCase()}\n` +
                    `Rules: ${cfg.words.length}\n` +
                    `Warned users: ${entries.length}\n` +
                    `Total warnings: ${total}`
                );
            }

            return reply('❌ Unknown option. Use .antiword for the command list.');
        } catch (error) {
            console.error('[ANTIWORD ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};

module.exports.handleOldantiWord = async function handleOldantiWord(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadJSON(DB);
        const cfg = db[m.chat];
        if (!cfg?.enabled || !cfg.words?.length) return;

        const text = messageText(m);
        const word = findBannedWord(text, cfg.words);
        if (!word) return;

        const meta = await getGroupInfo(sock, m.chat);
        const sender = senderOf(m);

        if (!meta || !sender || isAdmin(meta, sender)) return;

        await enforce(sock, m, cfg, `Banned word: ${word}`, WARNS);
        console.log(`[DEFENSE][ANTIWORD] ${sender} -> ${cfg.action} -> ${word}`);
    } catch (error) {
        console.error('[ANTIWORD HANDLER ERROR]', error.message);
    }
};
