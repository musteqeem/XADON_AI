const {
    loadConfig,
    saveConfig,
    normalizeJid,
    findLidForPhone,
    defaultConfig
} = require('../../Plugin/anticallManager');

module.exports = {
    name: 'anticall',
    alias: ['ac', 'callblock', 'callshield'],
    desc: 'Anti-call system with XDN defense core',
    category: 'Owner',
    reactions: { start: '📵', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();
        const config = loadConfig();

        if (!config.pendingPhoneReject) config.pendingPhoneReject = [];

        const toJid = (input) => {
            if (!input) return '';
            const trimmed = input.trim();
            if (/^\d+$/.test(trimmed)) {
                const lid = findLidForPhone(trimmed);
                if (lid) return lid;
                return `${trimmed}@s.whatsapp.net`;
            }
            return trimmed;
        };

        if (!sub || sub === 'status') {
            const s = config.schedule;
            let scheduleInfo = s.enabled
            ? `${s.type.toUpperCase()}: ${s.start} → ${s.end}`
                : 'Disabled';
            if (s.enabled && s.type === 'always') {
                scheduleInfo += `\nDays: ${s.days.length? s.days.join(',') : 'All'}`;
                scheduleInfo += `\nDates: ${s.dates.length? s.dates.join(',') : 'All'}`;
                scheduleInfo += `\nMonths: ${s.months.length? s.months.join(',') : 'All'}`;
            }

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ANTI-CALL STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Block Unknowns : ${config.enabled? 'ON' : 'OFF'}
│ ❏ Schedule : ${scheduleInfo.split('\n')[0]}
│ ❏ Whitelist : ${config.whitelist.length}
│ ❏ Blacklist : ${config.blacklist.length}
╰─────────────────────────╯

Commands:
֎.anticall on/off → Toggle unknowns
֎.anticall reason <text> → Set reject reason
֎.anticall unknownreason <text> → Unknown caller msg
֎.anticall schedule... → Manage schedule
֎.anticall reject add/remove/list <jid>
֎.anticall whitelist add/remove/list <jid>
֎.anticall log on/off → Toggle call logs
֎.anticall silent on/off → Silent block
֎.anticall notify on/off → Notify on block
֎.anticall stats → Show block stats
֎.anticall export → Export config
֎.anticall import JSON → Import config
֎.anticall reset → Reset to default`
            );
        }

        if (sub === 'on') {
            config.enabled = true;
            saveConfig(config);
            return reply('֎ Global block unknowns ENABLED');
        }

        if (sub === 'off') {
            config.enabled = false;
            saveConfig(config);
            return reply('֎ Global block unknowns DISABLED');
        }

        if (sub === 'reason') {
            const reason = args.slice(1).join(' ');
            if (!reason) return reply('֎ Provide a rejection message.');
            config.reason = reason;
            saveConfig(config);
            return reply(`֎ Reason set to:\n${reason}`);
        }

        if (sub === 'unknownreason') {
            const text = args.slice(1).join(' ');
            if (!text) return reply('֎ Provide a message for unknown callers.');
            config.unknownReason = text;
            saveConfig(config);
            return reply(`֎ Unknown caller reason set to:\n${text}`);
        }

        if (sub === 'schedule') {
            const action = args[1]?.toLowerCase();
            if (action === 'off') {
                config.schedule.enabled = false;
                saveConfig(config);
                return reply('֎ Schedule disabled');
            }

            if (action === 'once') {
                const start = args[2];
                const end = args[3];
                if (!start ||!end) return reply('֎ Usage:.anticall schedule once <start ISO> <end ISO>');
                config.schedule.enabled = true;
                config.schedule.type = 'once';
                config.schedule.start = start;
                config.schedule.end = end;
                saveConfig(config);
                return reply(`֎ One-time schedule set:\n${start} → ${end}`);
            }

            if (action === 'always') {
                const start = args[2];
                const end = args[3];
                if (!start ||!end) return reply('֎ Usage:.anticall schedule always <start HH:MM> <end HH:MM> [dates] [months]');
                config.schedule.enabled = true;
                config.schedule.type = 'always';
                config.schedule.start = start;
                config.schedule.end = end;
                config.schedule.days = args[4]? args[4].split(',').map(Number) : [];
                config.schedule.dates = args[5]? args[5].split(',').map(Number) : [];
                config.schedule.months = args[6]? args[6].split(',').map(Number) : [];
                saveConfig(config);
                return reply(
`֎ Recurring schedule set:
${start} → ${end}
Days: ${config.schedule.days.length? config.schedule.days.join(',') : 'All'}
Dates: ${config.schedule.dates.length? config.schedule.dates.join(',') : 'All'}
Months: ${config.schedule.months.length? config.schedule.months.join(',') : 'All'}`
                );
            }

            return reply('֎ Invalid schedule action. Use: off/once/always');
        }

        if (sub === 'reject') {
            const action = args[1]?.toLowerCase();
            const target = args.slice(2).join(' ').trim();

            if (action === 'add') {
                const jid = toJid(target);
                if (!jid) return reply('֎ Provide a phone number or JID.');
                if (!config.blacklist.includes(jid)) config.blacklist.push(jid);
                if (/^\d+$/.test(target) &&!jid.includes('@lid')) {
                    if (!config.pendingPhoneReject.includes(target)) {
                        config.pendingPhoneReject.push(target);
                    }
                    saveConfig(config);
                    return reply(`֎ Added ${jid} to reject list.\nⓘ LID will auto-upgrade on first call.`);
                }
                saveConfig(config);
                return reply(`֎ Added ${jid} to reject list.`);
            }

            if (action === 'remove') {
                const jid = toJid(target);
                if (!jid) return reply('֎ Provide a phone number or JID.');
                config.blacklist = config.blacklist.filter(b => normalizeJid(b)!== normalizeJid(jid));
                if (/^\d+$/.test(target)) {
                    config.pendingPhoneReject = config.pendingPhoneReject.filter(p => p!== target);
                }
                saveConfig(config);
                return reply(`֎ Removed ${jid} from reject list.`);
            }

            if (action === 'list') {
                const list = config.blacklist.length? config.blacklist.join('\n') : '(empty)';
                const pending = config.pendingPhoneReject?.length? config.pendingPhoneReject.join('\n') : '(none)';
                return reply(
`֎ *Blacklist:*
${list}

֎ *Pending LID:*
${pending}`
                );
            }

            return reply('֎ Usage:.anticall reject add/remove/list <number or JID>');
        }

        if (sub === 'whitelist') {
            const action = args[1]?.toLowerCase();
            const target = args.slice(2).join(' ').trim();

            if (!action || action === 'list') {
                const list = config.whitelist.length? config.whitelist.join('\n') : '(empty)';
                return reply(`֎ *Whitelist:*\n${list}`);
            }

            if (action === 'add') {
                const jid = toJid(target);
                if (!jid) return reply('֎ Provide a phone number or JID.');
                if (!config.whitelist.includes(jid)) {
                    config.whitelist.push(jid);
                    saveConfig(config);
                }
                return reply(`֎ Added ${jid} to whitelist.`);
            }

            if (action === 'remove') {
                const jid = toJid(target);
                if (!jid) return reply('֎ Provide a phone number or JID.');
                config.whitelist = config.whitelist.filter(w => normalizeJid(w)!== normalizeJid(jid));
                saveConfig(config);
                return reply(`֎ Removed ${jid} from whitelist.`);
            }

            return reply('֎ Usage:.anticall whitelist add/remove/list <number or JID>');
        }

        if (sub === 'log') {
            const mode = args[1]?.toLowerCase();
            config.logCalls = mode === 'on';
            saveConfig(config);
            return reply(`֎ Call logging ${mode.toUpperCase()}.`);
        }

        if (sub === 'silent') {
            const mode = args[1]?.toLowerCase();
            config.silentBlock = mode === 'on';
            saveConfig(config);
            return reply(`֎ Silent block ${mode.toUpperCase()}.`);
        }

        if (sub === 'notify') {
            const mode = args[1]?.toLowerCase();
            config.notifyOnBlock = mode === 'on';
            saveConfig(config);
            return reply(`֎ Notify on block ${mode.toUpperCase()}.`);
        }

        if (sub === 'stats') {
            const stats = config.stats || { blocked: 0, allowed: 0 };
            return reply(
`֎ *Call Block Stats*
❏ Blocked : ${stats.blocked}
❏ Allowed : ${stats.allowed}
❏ Total : ${stats.blocked + stats.allowed}`
            );
        }

        if (sub === 'export') {
            const data = JSON.stringify(config, null, 2);
            return reply(
`֎ *Anti-Call Export*
\`\`json
${data}
\`\``
            );
        }

        if (sub === 'import') {
            const jsonStr = args.slice(1).join(' ');
            if (!jsonStr) return reply('֎ Usage:.anticall import {\"key\":\"value\"}');

            try {
                const obj = JSON.parse(jsonStr);
                Object.assign(config, obj);
                saveConfig(config);
                return reply('֎ Config imported successfully.');
            } catch (e) {
                return reply('֎ Invalid JSON format.');
            }
        }

        if (sub === 'reset') {
            saveConfig(defaultConfig);
            return reply('֎ Anti-Call reset to defaults');
        }

        return reply('֎ Unknown subcommand. Use.anticall status for help.');
    }
};