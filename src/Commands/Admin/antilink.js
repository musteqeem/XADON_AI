const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'antilink.json');
const WARN_DB_PATH = path.join(process.cwd(), 'database', 'antilink_warns.json');

const normJid = jid => jid?.replace(/:\d+@/, '@');

function loadDB() {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
}

function saveDB(data) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function loadWarns() {
    if (!fs.existsSync(WARN_DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(WARN_DB_PATH, 'utf8')); } catch { return {}; }
}

function saveWarns(data) {
    fs.mkdirSync(path.dirname(WARN_DB_PATH), { recursive: true });
    fs.writeFileSync(WARN_DB_PATH, JSON.stringify(data, null, 2));
}

function ensureGroupConfig(db, group) {
    if (!db[group]) {
        db[group] = { enabled: false, action: 'delete', whitelist: [], permit: [], domains: [] };
    } else {
        if (!db[group].hasOwnProperty('whitelist')) db[group].whitelist = [];
        if (!db[group].hasOwnProperty('permit')) db[group].permit = [];
        if (!db[group].hasOwnProperty('domains')) db[group].domains = [];
        if (!db[group].hasOwnProperty('action')) db[group].action = 'delete';
        if (!db[group].hasOwnProperty('enabled')) db[group].enabled = false;
    }
    return db[group];
}

function hasLink(text) {
    return /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i.test(text);
}

function extractUrls(text) {
    const matches = text.match(/https?:\/\/[^\s<>]+/gi);
    return matches || [];
}

function extractDomains(urls) {
    const domains = [];
    for (const url of urls) {
        try {
            const domain = url.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
            domains.push(domain);
        } catch (e) {}
    }
    return domains;
}

function isUrlAllowed(urls, whitelist) {
    if (!whitelist ||!whitelist.length) return false;
    return urls.some(url => whitelist.some(allowed => url === allowed));
}

function isPermitted(urls, permitList) {
    if (!permitList ||!permitList.length) return false;
    return urls.some(url => permitList.some(permitted =>
        url.toLowerCase().startsWith(permitted.toLowerCase())
    ));
}

function isDomainAllowed(urls, domainList) {
    if (!domainList ||!domainList.length) return false;
    const domains = extractDomains(urls);
    return domains.some(domain => domainList.some(allowedDomain =>
        domain === allowedDomain.toLowerCase() || domain.endsWith('.' + allowedDomain.toLowerCase())
    ));
}

module.exports = {
    name: 'antilink',
    alias: ['al'],
    desc: 'Block links, with allow, permit, domain whitelist, delete/warn/kick actions',
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🖇️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        if (!m.isGroup) return reply('_*֎ Group only*_');

        const db = loadDB();
        const group = m.chat;
        const cfg = ensureGroupConfig(db, group);
        saveDB(db);

        const sub = args[0]?.toLowerCase();

        if (!sub) {
            const whitelist = cfg.whitelist.length? cfg.whitelist.map(u => `│ ❏ ${u}`).join('\n') : '│ ❏ none';
            const permit = cfg.permit.length? cfg.permit.map(u => `│ ❏ ${u}`).join('\n') : '│ ❏ none';
            const domains = cfg.domains.length? cfg.domains.map(d => `│ ❏ ${d}`).join('\n') : '│ ❏ none';

            let actionDisplay;
            if (cfg.action === 'delete') actionDisplay = 'DELETE';
            else if (cfg.action === 'warn') actionDisplay = 'WARN 3x KICK';
            else if (cfg.action === 'kick') actionDisplay = 'KICK';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • ANTI LINK •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Action : ${actionDisplay}
│ ❏ Toggle : antilink on/off
│ ❏ Mode : antilink delete/warn/kick
│ ❏ Add Domain : antilink add <domain>
│ ❏ Remove Domain : antilink remove <domain>
│ ❏ Allow Link : antilink allow <url>
│ ❏ Permit Prefix : antilink permit <url>
│ ❏ Lists : antilink allowlist/permitlist/domainlist
│ ❏ Check : antilink warncount @user
│ ❏ List Warns : antilink listwarns
│ ❏ Reset : antilink resetwarn @user
│ ❏ Nuke : antilink resetall
│ ❏ Clear : antilink clear
╰─────────────────────────╯`
            );
        }

        if (sub === 'on') {
            cfg.enabled = true;
            saveDB(db);
            let actionText = cfg.action.toUpperCase();
            return reply(`_*◉ Anti Link ACTIVE*_\n❏ Mode : ${actionText}`);
        }
        if (sub === 'off') {
            cfg.enabled = false;
            saveDB(db);
            return reply('_*◉ Anti Link INACTIVE*_');
        }
        if (sub === 'delete') {
            cfg.action = 'delete';
            saveDB(db);
            return reply('_*◉ Action SET*_\n❏ Mode : DELETE');
        }
        if (sub === 'warn') {
            cfg.action = 'warn';
            saveDB(db);
            return reply('_*◉ Action SET*_\n❏ Mode : WARN 3x KICK');
        }
        if (sub === 'kick') {
            cfg.action = 'kick';
            saveDB(db);
            return reply('_*◉ Action SET*_\n❏ Mode : KICK');
        }

        if (sub === 'add') {
            const domain = args[1]?.trim().toLowerCase();
            if (!domain) return reply('_*✐ Usage*_ : ֎antilink add <domain>\n֎ Example : github.com');

            let cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/^www\./, '').replace(/\/$/, '');
            if (cfg.domains.includes(cleanDomain)) return reply('_*❏ Domain Already Whitelisted*_');
            cfg.domains.push(cleanDomain);
            saveDB(db);
            return reply(`_*✓ Domain Added*_\n❏ ${cleanDomain}`);
        }

        if (sub === 'remove') {
            const domain = args[1]?.trim().toLowerCase();
            if (!domain) return reply('_*✐ Usage*_ : ֎antilink remove <domain>');

            let cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/^www\./, '').replace(/\/$/, '');
            const idx = cfg.domains.indexOf(cleanDomain);
            if (idx === -1) return reply('_*❏ Domain Not Found*_');
            cfg.domains.splice(idx, 1);
            saveDB(db);
            return reply(`_*֎ Removed*_\n❏ ${cleanDomain}`);
        }

        if (sub === 'clear') {
            cfg.enabled = false;
            cfg.action = 'delete';
            cfg.whitelist = [];
            cfg.permit = [];
            cfg.domains = [];
            saveDB(db);
            return reply(`_*֎ Settings Cleared*_\n❏ Status : OFF\n❏ Action : DELETE\n❏ All lists cleared`);
        }

        if (sub === 'allow') {
            const url = args[1]?.trim();
            if (!url ||!url.startsWith('http')) return reply('_*✐ Usage*_ : ֎antilink allow <full_url>');
            if (cfg.whitelist.includes(url)) return reply('_*❏ Link Already Allowed*_');
            cfg.whitelist.push(url);
            saveDB(db);
            return reply(`_*✓ Link Allowed*_\n❏ ${url}`);
        }
        if (sub === 'disallow') {
            const url = args[1]?.trim();
            if (!url) return reply('_*✐ Usage*_ : ֎antilink disallow <full_url>');
            const idx = cfg.whitelist.indexOf(url);
            if (idx === -1) return reply('_*❏ Link Not Found*_');
            cfg.whitelist.splice(idx, 1);
            saveDB(db);
            return reply(`_*֎ Removed*_\n❏ ${url}`);
        }
        if (sub === 'permit') {
            const url = args[1]?.trim();
            if (!url ||!url.startsWith('http')) return reply('_*✐ Usage*_ : ֎antilink permit <url_prefix>');
            if (cfg.permit.includes(url)) return reply('_*❏ Prefix Already Permitted*_');
            cfg.permit.push(url);
            saveDB(db);
            return reply(`_*✓ Prefix Permitted*_\n❏ ${url}`);
        }
        if (sub === 'unpermit') {
            const url = args.slice(1).join(' ')?.trim();
            if (!url) return reply('_*✐ Usage*_ : ֎antilink unpermit <url_prefix>');
            const idx = cfg.permit.findIndex(p => p === url);
            if (idx === -1) return reply('_*❏ Prefix Not Found*_');
            const removed = cfg.permit.splice(idx, 1);
            saveDB(db);
            return reply(`_*֎ Removed*_\n❏ ${removed[0]}`);
        }
        if (sub === 'allowlist') {
            if (!cfg.whitelist.length) return reply('_*❏ No Allowed Links*_');
            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - ALLOW LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *EXACT URLS*\n`;
            text += cfg.whitelist.map(u => `│ ❏ ${u}`).join('\n');
            text += `\n╰─────────────────────────╯`;
            return reply(text);
        }
        if (sub === 'permitlist') {
            if (!cfg.permit.length) return reply('_*❏ No Permitted Prefixes*_');
            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - PERMIT LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *URL PREFIXES*\n`;
            text += cfg.permit.map(u => `│ ❏ ${u}`).join('\n');
            text += `\n╰─────────────────────────╯`;
            return reply(text);
        }
        if (sub === 'domainlist') {
            if (!cfg.domains.length) return reply('_*❏ No Whitelisted Domains*_');
            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - DOMAIN LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *WHITELISTED*\n`;
            text += cfg.domains.map(d => `│ ❏ ${d}`).join('\n');
            text += `\n╰─────────────────────────╯`;
            return reply(text);
        }
        if (sub === 'warncount') {
            let target = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!target && args[1]) {
                const num = args[1].replace(/[^0-9]/g, '');
                if (num) target = num + '@s.whatsapp.net';
            }
            if (!target) return reply('_*✐ Usage*_ : ֎antilink warncount @user/reply/number');

            target = normJid(target);
            const warns = loadWarns();
            const key = `${group}_${target}`;
            const count = warns[key]?.count || 0;
            return reply(`_*❏ Warn Status*_\n◉ User : @${target.split('@')[0]}\n◉ Count : ${count}/3`, { mentions: [target] });
        }
        if (sub === 'listwarns') {
            const warns = loadWarns();
            const groupWarns = Object.entries(warns)
             .filter(([k]) => k.startsWith(group + '_'))
             .sort((a, b) => b[1].count - a[1].count)
             .slice(0, 10);

            if (!groupWarns.length) return reply('_*❏ No Active Warnings*_');

            let txt = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - WARN LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *TOP OFFENDERS*\n`;
            const mentions = [];
            groupWarns.forEach(([k, v], i) => {
                const user = v.user;
                mentions.push(user);
                txt += `│ ${i+1}. @${user.split('@')[0]} - ${v.count}/3\n`;
            });
            txt += `╰─────────────────────────╯`;
            return reply(txt, { mentions });
        }
        if (sub === 'resetwarn') {
            let target = m.mentionedJid?.[0] || m.quoted?.sender;
            if (!target && args[1]) {
                const num = args[1].replace(/[^0-9]/g, '');
                if (num) target = num + '@s.whatsapp.net';
            }
            if (!target) return reply('_*✐ Usage*_ : ֎antilink resetwarn @user/reply/number');

            target = normJid(target);
            const warns = loadWarns();
            const key = `${group}_${target}`;
            if (warns[key]) {
                delete warns[key];
                saveWarns(warns);
                return reply(`_*❏ Warnings Reset*_\n◉ User : @${target.split('@')[0]}`, { mentions: [target] });
            }
            return reply('_*❏ No Warnings Found*_');
        }
        if (sub === 'resetall') {
            const warns = loadWarns();
            let cleared = 0;
            for (const key of Object.keys(warns)) {
                if (key.startsWith(group + '_')) {
                    delete warns[key];
                    cleared++;
                }
            }
            saveWarns(warns);
            return reply(`_*֎ Reset Complete*_\n❏ Cleared : ${cleared} warning records`);
        }
        if (sub === 'stats') {
            const warns = loadWarns();
            const groupWarns = Object.keys(warns).filter(k => k.startsWith(group + '_'));
            const totalWarns = groupWarns.reduce((sum, k) => sum + warns[k].count, 0);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - STATS •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ANTILINK STATS*\n│ ❏ Status : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}\n│ ❏ Action : ${cfg.action.toUpperCase()}\n│ ❏ Users Warned : ${groupWarns.length}\n│ ❏ Total Warns : ${totalWarns}\n│ ❏ Domains : ${cfg.domains.length}\n│ ❏ Allowed Links : ${cfg.whitelist.length}\n╰─────────────────────────╯`);
        }

        reply('_*✐ Usage*_ : ֎antilink on/off/delete/warn/kick/add/remove/allow/disallow/permit/unpermit/lists/warncount/listwarns/resetwarn/resetall/stats/clear');
    }
};

// ── Message Handler ──────────────────────────────────────────────
module.exports.handleAntiLink = async function(sock, m) {
    try {
        if (!m.isGroup) return;
        if (m.key?.fromMe) return;

        const db = loadDB();
        const group = m.chat;
        if (!db[group]) return;

        const cfg = db[group];
        if (!cfg.enabled) return;

        const msg = m.message || {};
        const parts = [
            m.text,
            m.body,
            msg.conversation,
            msg.extendedTextMessage?.text,
            msg.extendedTextMessage?.matchedText,
            msg.imageMessage?.caption,
            msg.videoMessage?.caption,
            msg.documentMessage?.caption,
            msg.audioMessage?.caption,
        ].filter(Boolean);

        const text = parts.join(' ');
        if (!text) return;
        if (!hasLink(text)) return;

        const urls = extractUrls(text);

        if (cfg.whitelist?.length && isUrlAllowed(urls, cfg.whitelist)) return;
        if (cfg.permit?.length && isPermitted(urls, cfg.permit)) return;
        if (cfg.domains?.length && isDomainAllowed(urls, cfg.domains)) return;

        const meta = await sock.groupMetadata(group).catch(() => null);
        if (!meta) return;

        const sender = normJid(m.sender);
        if (!sender) return;

        const admins = meta.participants
         .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
         .map(p => normJid(p.id));
        if (admins.includes(sender)) return;

        const action = cfg.action || 'delete';
        await sock.sendMessage(group, { delete: m.key }).catch(() => {});

        if (action === 'delete') {
            await sock.sendMessage(group, {
                text: `_*❏ Link Blocked*_\n◉ User : @${sender.split('@')[0]}\n◉ Action : Message Deleted`,
                mentions: [sender]
            }).catch(() => {});
        }
        else if (action === 'warn') {
            const warns = loadWarns();
            const warnKey = `${group}_${sender}`;

            if (!warns[warnKey]) warns[warnKey] = { count: 0, user: sender };
            warns[warnKey].count++;
            saveWarns(warns);

            const warnCount = warns[warnKey].count;

            if (warnCount >= 3) {
                delete warns[warnKey];
                saveWarns(warns);

                await sock.sendMessage(group, {
                    text: `_*◉ User Removed*_\n❏ Target : @${sender.split('@')[0]}\n❏ Reason : 3/3 Warnings - Link Violation`,
                    mentions: [sender]
                }).catch(() => {});

                await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
            } else {
                await sock.sendMessage(group, {
                    text: `_*❏ Warning Issued*_\n◉ User : @${sender.split('@')[0]}\n◉ Count : ${warnCount}/3\n◉ Note : ${3 - warnCount} more result in removal`,
                    mentions: [sender]
                }).catch(() => {});
            }
        }
        else if (action === 'kick') {
            await sock.sendMessage(group, {
                text: `_*◉ User Removed*_\n❏ Target : @${sender.split('@')[0]}\n❏ Reason : Link Violation`,
                mentions: [sender]
            }).catch(() => {});

            await sock.groupParticipantsUpdate(group, [sender], 'remove').catch(() => {});
        }

        console.log(`[XADON AI ANTILINK] ${action} → ${sender.split('@')[0]} | link detected`);

    } catch (err) {
        console.error('[XADON AI ANTILINK ERROR]', err.message);
    }
};