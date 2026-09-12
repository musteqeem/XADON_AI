const {
    loadConfig,
    saveConfig,
    normalizeJid,
    findLidForPhone,
    defaultConfig
} = require('../../Plugin/anticallManager');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'anticall',
    alias: ['ac', 'callblock'],
    desc: 'Manage anti-call settings. Whitelist/Blacklist always active',
    category: 'Owner',
    usage: '.anticall <subcommand>',
    ownerOnly: true,

    execute: async (sock, m, { args, reply, prefix }) => {
        console.log(`[${BOT_NAME} ANTICALL] args:`, args);
        const sub = args[0]?.toLowerCase();
        const config = loadConfig();

        if (!config.pendingPhoneReject) config.pendingPhoneReject = [];

        const toJid = (input) => {
            if (!input) return '';
            const trimmed = input.trim();
            if (/^\d+$/.test(trimmed)) {
                const lid = findLidForPhone(trimmed);
                if (lid) {
                    console.log(`[${BOT_NAME}] Found LID for ${trimmed}: ${lid}`);
                    return lid;
                }
                console.log(`[${BOT_NAME}] No LID found for ${trimmed}, using phone JID.`);
                return `${trimmed}@s.whatsapp.net`;
            }
            return trimmed;
        };

        // --- HELP ---
        if (!sub) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ANTI-CALL*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *MANAGER GUIDE*
│ ❏ Note : Whitelist & Blacklist ALWAYS active
│ ❏ Global : ON/OFF controls unknown callers
│
│ ❏ Commands :
│ ❏ ${prefix}anticall on/off
│ ❏ ${prefix}anticall reason <text>
│ ❏ ${prefix}anticall unknownreason <text>
│ ❏ ${prefix}anticall schedule once <start> <end>
│ ❏ ${prefix}anticall schedule always <start> <end> [days] [dates] [months]
│ ❏ ${prefix}anticall schedule off
│ ❏ ${prefix}anticall reject add/remove/list <number>
│ ❏ ${prefix}anticall whitelist add/remove/list <number>
│ ❏ ${prefix}anticall status
│ ❏ ${prefix}anticall reset
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // --- ON / OFF ---
        if (sub === 'on') {
            config.enabled = true;
            saveConfig(config);
            return reply(`✓ Global block unknowns ENABLED`);
        }
        if (sub === 'off') {
            config.enabled = false;
            saveConfig(config);
            return reply(`✘ Global block unknowns DISABLED`);
        }

        // --- REASON ---
        if (sub === 'reason') {
            const reason = args.slice(1).join(' ');
            if (!reason) return reply(`✘ Provide a rejection message.`);
            config.reason = reason;
            saveConfig(config);
            return reply(`✓ Reason set:\n${reason}`);
        }

        // --- UNKNOWN REASON ---
        if (sub === 'unknownreason') {
            const text = args.slice(1).join(' ');
            if (!text) return reply(`✘ Provide a message for unknown callers.`);
            config.unknownReason = text;
            saveConfig(config);
            return reply(`✓ Unknown caller reason set:\n${text}`);
        }

        // --- SCHEDULE ---
        if (sub === 'schedule') {
            const action = args[1]?.toLowerCase();
            if (action === 'off') {
                config.schedule.enabled = false;
                saveConfig(config);
                return reply(`✓ Schedule disabled`);
            }
            if (action === 'once') {
                const start = args[2];
                const end = args[3];
                if (!start ||!end) return reply(`✘ Usage: ${prefix}anticall schedule once <start ISO> <end ISO>`);
                config.schedule.enabled = true;
                config.schedule.type = 'once';
                config.schedule.start = start;
                config.schedule.end = end;
                saveConfig(config);
                return reply(`✓ One-time schedule set:\n${start} → ${end}`);
            }
            if (action === 'always') {
                const start = args[2];
                const end = args[3];
                if (!start ||!end) return reply(`✘ Usage: ${prefix}anticall schedule always <start HH:MM> <end HH:MM> [days] [dates] [months]`);
                config.schedule.enabled = true;
                config.schedule.type = 'always';
                config.schedule.start = start;
                config.schedule.end = end;
                config.schedule.days = args[4]? args[4].split(',').map(Number) : [];
                config.schedule.dates = args[5]? args[5].split(',').map(Number) : [];
                config.schedule.months = args[6]? args[6].split(',').map(Number) : [];
                saveConfig(config);
                return reply(
`✓ Recurring schedule set:
${start} → ${end}
Days: ${config.schedule.days.length? config.schedule.days.join(',') : 'All'}
Dates: ${config.schedule.dates.length? config.schedule.dates.join(',') : 'All'}
Months: ${config.schedule.months.length? config.schedule.months.join(',') : 'All'}`
                );
            }
            return reply(`✘ Invalid schedule action. Use: on/off/once/always`);
        }

        // --- REJECT ---
        if (sub === 'reject') {
            const action = args[1]?.toLowerCase();
            const target = args.slice(2).join(' ').trim();

            if (action === 'add') {
                const jid = toJid(target);
                if (!jid) return reply(`✘ Provide a phone number or JID.`);
                if (!config.blacklist.includes(jid)) config.blacklist.push(jid);
                if (/^\d+$/.test(target) &&!jid.includes('@lid')) {
                    if (!config.pendingPhoneReject.includes(target)) config.pendingPhoneReject.push(target);
                    saveConfig(config);
                    return reply(`✓ Added ${jid} to reject list.\n֎ LID not yet known - will auto-upgrade on first call.`);
                }
                saveConfig(config);
                return reply(`✓ Added ${jid} to reject list.`);
            }
            if (action === 'remove') {
                const jid = toJid(target);
                if (!jid) return reply(`✘ Provide a phone number or JID.`);
                config.blacklist = config.blacklist.filter(b => normalizeJid(b)!== normalizeJid(jid));
                if (/^\d+$/.test(target)) config.pendingPhoneReject = config.pendingPhoneReject.filter(p => p!== target);
                saveConfig(config);
                return reply(`✓ Removed ${jid} from reject list.`);
            }
            if (action === 'list') {
                const list = config.blacklist.length? config.blacklist.join('\n') : '(empty)';
                const pending = config.pendingPhoneReject?.length? config.pendingPhoneReject.join('\n') : '(none)';
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} BLACKLIST*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ACTIVE*
${list.split('\n').map(l=>`│ ❏ ${l}`).join('\n')}
│
╭─֎ *PENDING LID*
${pending.split('\n').map(l=>`│ ❏ ${l}`).join('\n')}
╰─────────────────────────╯`
                );
            }
            return reply(`✘ Usage: ${prefix}anticall reject add/remove/list <number or JID>`);
        }

        // --- WHITELIST ---
        if (sub === 'whitelist') {
            const action = args[1]?.toLowerCase();
            const target = args.slice(2).join(' ').trim();

            if (!action) {
                const list = config.whitelist.length? config.whitelist.join('\n') : '(empty)';
                return reply(`✓ Whitelist:\n${list}`);
            }
            if (action === 'add') {
                const jid = toJid(target);
                if (!jid) return reply(`✘ Provide a phone number or JID.`);
                if (!config.whitelist.includes(jid)) {
                    config.whitelist.push(jid);
                    saveConfig(config);
                }
                return reply(`✓ Added ${jid} to whitelist. Never rejected.`);
            }
            if (action === 'remove') {
                const jid = toJid(target);
                if (!jid) return reply(`✘ Provide a phone number or JID.`);
                config.whitelist = config.whitelist.filter(w => normalizeJid(w)!== normalizeJid(jid));
                saveConfig(config);
                return reply(`✓ Removed ${jid} from whitelist.`);
            }
            if (action === 'list') {
                const list = config.whitelist.length? config.whitelist.join('\n') : '(empty)';
                return reply(`✓ Whitelist:\n${list}`);
            }
            return reply(`✘ Usage: ${prefix}anticall whitelist [add/remove/list] <number or JID>`);
        }

        // --- STATUS ---
        if (sub === 'status') {
            const s = config.schedule;
            let scheduleInfo = s.enabled? `${s.type.toUpperCase()}: ${s.start} → ${s.end}` : 'Disabled';
            if (s.enabled && s.type === 'always') {
                scheduleInfo += `\nDays: ${s.days.length? s.days.join(',') : 'All'}`;
                scheduleInfo += `\nDates: ${s.dates.length? s.dates.join(',') : 'All'}`;
                scheduleInfo += `\nMonths: ${s.months.length? s.months.join(',') : 'All'}`;
            }

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ANTI-CALL STATUS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GLOBAL*
│ ❏ Block Unknowns : ${config.enabled? 'ON' : 'OFF'}
│ ❏ Schedule : ${scheduleInfo}
│
╭─֎ *LISTS*
│ ❏ Whitelisted : ${config.whitelist.length} entries
│ ❏ Blacklisted : ${config.blacklist.length} entries
│ ❏ Pending LID : ${config.pendingPhoneReject?.length || 0} numbers
│
╭─֎ *MESSAGES*
│ ❏ Blocked : ${config.reason}
│ ❏ Unknown : ${config.unknownReason || '(not set)'}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // --- RESET ---
        if (sub === 'reset') {
            saveConfig(defaultConfig);
            return reply(`✓ Anti-Call reset to defaults`);
        }

        return reply(`✘ Unknown subcommand. Use ${prefix}anticall for help.`);
    }
};