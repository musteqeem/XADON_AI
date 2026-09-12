const {
    loadJSON,
    saveJSON,
    normJid,
    messageText,
    getGroupInfo,
    isAdmin,
    senderOf,
    enforce,
    targetFromMessage
} = require('./_utils');

const DB = 'oldantilink';
const WARNS = 'antilink_warns';

function extractUrls(text) {
    return text.match(/(?:https?:\/\/|www\.)[^\s<>]+/gi) || [];
}

function hasLink(text) {
    return /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me\b)/i.test(text);
}

function extractDomain(url) {
    try {
        const value = url.match(/^(?:https?:\/\/)?([^/\s?#]+)/i)?.[1] || '';
        return value.replace(/^www\./i, '').toLowerCase();
    } catch {
        return '';
    }
}

function allowed(urls, cfg) {
    return urls.some(url => cfg.whitelist?.some(item => url.toLowerCase() === item.toLowerCase())) ||
        urls.some(url => cfg.permit?.some(item => url.toLowerCase().startsWith(item.toLowerCase()))) ||
        urls.some(url => {
            const domain = extractDomain(url);
            return cfg.domains?.some(item =>
                domain === item || domain.endsWith(`.${item}`)
            );
        });
}

function ensure(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            action: 'delete',
            warnLimit: 3,
            whitelist: [],
            permit: [],
            domains: []
        };
    }

    return db[group];
}

module.exports = {
    name: 'antilink',
    alias: ['al'],
    category: 'Defense',
    desc: 'Block unwanted links with whitelist, domain rules and moderation actions',
    usage: '.antilink on/off | .antilink delete/warn/kick | .antilink add <domain>',
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
                    `🛡️ *ANTI LINK*\n\n` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}\n` +
                    `Action: ${cfg.action.toUpperCase()}\n` +
                    `Domains: ${cfg.domains.length}\n` +
                    `Exact links: ${cfg.whitelist.length}\n` +
                    `Prefixes: ${cfg.permit.length}\n\n` +
                    `• .antilink on/off\n` +
                    `• .antilink delete/warn/kick\n` +
                    `• .antilink add <domain>\n` +
                    `• .antilink remove <domain>\n` +
                    `• .antilink allow <url>\n` +
                    `• .antilink disallow <url>\n` +
                    `• .antilink permit <url-prefix>\n` +
                    `• .antilink unpermit <url-prefix>\n` +
                    `• .antilink list\n` +
                    `• .antilink stats\n` +
                    `• .antilink resetwarn @user`
                );
            }

            if (sub === 'on' || sub === 'off') {
                cfg.enabled = sub === 'on';
                saveJSON(DB, db);
                return reply(`🛡️ Anti Link ${cfg.enabled ? 'enabled' : 'disabled'}.`);
            }

            if (['delete', 'warn', 'kick'].includes(sub)) {
                cfg.action = sub;
                saveJSON(DB, db);
                return reply(`🛡️ Anti Link action set to *${sub.toUpperCase()}*.`);
            }

            if (sub === 'add') {
                const domain = String(args?.[1] || '')
                    .trim()
                    .toLowerCase()
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')
                    .split('/')[0];

                if (!domain) return reply('❌ Usage: .antilink add <domain>');
                if (!cfg.domains.includes(domain)) cfg.domains.push(domain);
                saveJSON(DB, db);
                return reply(`✅ Allowed domain: ${domain}`);
            }

            if (sub === 'remove') {
                const domain = String(args?.[1] || '').toLowerCase().replace(/^www\./, '');
                const index = cfg.domains.indexOf(domain);

                if (index === -1) return reply('❌ Domain is not in the list.');

                cfg.domains.splice(index, 1);
                saveJSON(DB, db);
                return reply(`✅ Removed domain: ${domain}`);
            }

            if (sub === 'allow' || sub === 'disallow') {
                const url = String(args?.[1] || '').trim();

                if (!url) return reply(`❌ Usage: .antilink ${sub} <url>`);

                if (sub === 'allow') {
                    if (!cfg.whitelist.includes(url)) cfg.whitelist.push(url);
                } else {
                    cfg.whitelist = cfg.whitelist.filter(item => item !== url);
                }

                saveJSON(DB, db);
                return reply(`✅ Exact link ${sub === 'allow' ? 'allowed' : 'removed'}: ${url}`);
            }

            if (sub === 'permit' || sub === 'unpermit') {
                const prefix = String(args?.slice(1).join(' ') || '').trim();

                if (!prefix) return reply(`❌ Usage: .antilink ${sub} <url-prefix>`);

                if (sub === 'permit') {
                    if (!cfg.permit.includes(prefix)) cfg.permit.push(prefix);
                } else {
                    cfg.permit = cfg.permit.filter(item => item !== prefix);
                }

                saveJSON(DB, db);
                return reply(`✅ URL prefix ${sub === 'permit' ? 'permitted' : 'removed'}: ${prefix}`);
            }

            if (sub === 'list') {
                return reply(
                    `🛡️ *ANTI LINK RULES*\n\n` +
                    `Domains:\n${cfg.domains.length ? cfg.domains.map(x => `• ${x}`).join('\n') : '• none'}\n\n` +
                    `Exact links:\n${cfg.whitelist.length ? cfg.whitelist.map(x => `• ${x}`).join('\n') : '• none'}\n\n` +
                    `Prefixes:\n${cfg.permit.length ? cfg.permit.map(x => `• ${x}`).join('\n') : '• none'}`
                );
            }

            if (sub === 'warncount') {
                const target = targetFromMessage(m, args);
                if (!target) return reply('❌ Mention, quote or provide a phone number.');

                const warns = loadJSON(WARNS);
                const count = warns[`${m.chat}_${target}`]?.count || 0;

                return reply(`⚠️ @${target.split('@')[0]} has ${count}/${cfg.warnLimit} warnings.`, {
                    mentions: [target]
                });
            }

            if (sub === 'resetwarn') {
                const target = targetFromMessage(m, args);
                if (!target) return reply('❌ Mention, quote or provide a phone number.');

                const warns = loadJSON(WARNS);
                delete warns[`${m.chat}_${target}`];
                saveJSON(WARNS, warns);

                return reply(`✅ Warnings reset for @${target.split('@')[0]}.`, {
                    mentions: [target]
                });
            }

            if (sub === 'stats') {
                const warns = loadJSON(WARNS);
                const entries = Object.entries(warns).filter(([key]) => key.startsWith(`${m.chat}_`));
                const total = entries.reduce((sum, [, value]) => sum + (value.count || 0), 0);

                return reply(
                    `📊 *ANTI LINK STATS*\n\n` +
                    `Status: ${cfg.enabled ? 'ON' : 'OFF'}\n` +
                    `Action: ${cfg.action.toUpperCase()}\n` +
                    `Warned users: ${entries.length}\n` +
                    `Total warnings: ${total}`
                );
            }

            return reply('❌ Unknown option. Use .antilink for the command list.');
        } catch (error) {
            console.error('[ANTILINK ERROR]', error);
            return reply(`❌ Error: ${error.message}`);
        }
    }
};

module.exports.handleOldantiLink = async function handleOldantiLink(sock, m) {
    try {
        if (!m.isGroup || m.key?.fromMe) return;

        const db = loadJSON(DB);
        const cfg = db[m.chat];
        if (!cfg?.enabled) return;

        const text = messageText(m);
        if (!text || !hasLink(text)) return;

        const urls = extractUrls(text);
        if (allowed(urls, cfg)) return;

        const meta = await getGroupInfo(sock, m.chat);
        const sender = senderOf(m);

        if (!meta || !sender || isAdmin(meta, sender)) return;

        await enforce(sock, m, cfg, 'Unapproved link', WARNS);
        console.log(`[DEFENSE][ANTILINK] ${sender} -> ${cfg.action}`);
    } catch (error) {
        console.error('[ANTILINK HANDLER ERROR]', error.message);
    }
};
