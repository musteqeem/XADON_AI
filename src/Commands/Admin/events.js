// © 2026 XDN BOT - All Rights Reserved.
const fs = require('fs');
const path = './database/groupEvents.json';

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));

function ensureGroupConfig(db, group) {
    if (!db[group]) {
        db[group] = {
            enabled: false,
            welcomeEnabled: false,
            goodbyeEnabled: false,
            welcome: null,
            goodbye: null,
            log: false,
            testMode: false,
            deleteDelay: 0,
            notifyAdmins: false,
            showPP: true,
            showDate: true,
            showTime: true,
            showCount: true
        };
    }
    return db[group];
}

module.exports = {
    name: 'events',
    alias: ['groupevents', 'ev'],
    desc: 'Control group events system with XDN defense core',
    category: 'group',
    group: true,
    admin: true,
    owner: true,
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { reply }) => {
        try {
            const args = m.body.trim().split(/\s+/);
            const option = args[1]?.toLowerCase();
            const db = JSON.parse(fs.readFileSync(path));
            const cfg = ensureGroupConfig(db, m.chat);
            fs.writeFileSync(path, JSON.stringify(db, null, 2));

            if (!option || option === 'status') {
                return await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GROUP EVENTS SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ System : ${cfg.enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Welcome : ${cfg.welcomeEnabled? 'ON' : 'OFF'}
│ ❏ Goodbye : ${cfg.goodbyeEnabled? 'ON' : 'OFF'}
│ ❏ Log : ${cfg.log? 'ON' : 'OFF'}
│ ❏ Test Mode : ${cfg.testMode? 'ON' : 'OFF'}
│ ❏ Delete Delay : ${cfg.deleteDelay}s
╰─────────────────────────╯

Commands:
֎.events on/off → Toggle system
֎.events welcome/goodbye/both → Set mode
֎.events log on/off → Toggle logs
֎.events test → Test events
֎.events delay <sec> → Set delete delay
֎.events admins on/off → Notify admins
֎.events pp on/off → Show profile pic
֎.events date on/off → Show date
֎.events time on/off → Show time
֎.events count on/off → Show member count
֎.events reset → Reset config
֎.events clear → Clear messages`
                );
            }

            if (option === 'on') {
                cfg.enabled = true;
                cfg.welcomeEnabled = true;
                cfg.goodbyeEnabled = true;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • EVENTS SYSTEM ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
All events are now ONLINE.`
                );
            }

            if (option === 'off') {
                cfg.enabled = false;
                cfg.welcomeEnabled = false;
                cfg.goodbyeEnabled = false;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • EVENTS SYSTEM DEACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
All events are now OFFLINE.`
                );
            }

            if (option === 'welcome') {
                cfg.enabled = true;
                cfg.welcomeEnabled = true;
                cfg.goodbyeEnabled = false;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return await reply('֎ Welcome Only Mode ENABLED.');
            }

            if (option === 'goodbye') {
                cfg.enabled = true;
                cfg.welcomeEnabled = false;
                cfg.goodbyeEnabled = true;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return await reply('֎ Goodbye Only Mode ENABLED.');
            }

            if (option === 'both') {
                cfg.enabled = true;
                cfg.welcomeEnabled = true;
                cfg.goodbyeEnabled = true;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return await reply('֎ Welcome + Goodbye Mode ENABLED.');
            }

            if (option === 'log') {
                const mode = args[2]?.toLowerCase();
                if (mode === 'on') cfg.log = true;
                else if (mode === 'off') cfg.log = false;
                else return reply('֎ Usage:.events log on/off');
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Event logging ${mode.toUpperCase()}.`);
            }

            if (option === 'test') {
                cfg.testMode =!cfg.testMode;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Test Mode ${cfg.testMode? 'ENABLED' : 'DISABLED'}.\nJoin/leave to test events.`);
            }

            if (option === 'delay') {
                const sec = parseInt(args[2]);
                if (isNaN(sec) || sec < 0 || sec > 60) return reply('֎ Usage:.events delay 0-60 seconds');
                cfg.deleteDelay = sec;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Delete delay set to ${sec}s.`);
            }

            if (option === 'adminson') {
                cfg.notifyAdmins = true;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply('֎ Admin notifications ENABLED.');
            }

            if (option === 'adminsoff') {
                cfg.notifyAdmins = false;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply('֎ Admin notifications DISABLED.');
            }

            if (option === 'pp') {
                const mode = args[2]?.toLowerCase();
                if (mode === 'on') cfg.showPP = true;
                else if (mode === 'off') cfg.showPP = false;
                else return reply('֎ Usage:.events pp on/off');
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Profile pic display ${mode.toUpperCase()}.`);
            }

            if (option === 'date') {
                const mode = args[2]?.toLowerCase();
                if (mode === 'on') cfg.showDate = true;
                else if (mode === 'off') cfg.showDate = false;
                else return reply('֎ Usage:.events date on/off');
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Date display ${mode.toUpperCase()}.`);
            }

            if (option === 'time') {
                const mode = args[2]?.toLowerCase();
                if (mode === 'on') cfg.showTime = true;
                else if (mode === 'off') cfg.showTime = false;
                else return reply('֎ Usage:.events time on/off');
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Time display ${mode.toUpperCase()}.`);
            }

            if (option === 'count') {
                const mode = args[2]?.toLowerCase();
                if (mode === 'on') cfg.showCount = true;
                else if (mode === 'off') cfg.showCount = false;
                else return reply('֎ Usage:.events count on/off');
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(`֎ Member count display ${mode.toUpperCase()}.`);
            }

            if (option === 'reset') {
                db[m.chat] = {
                    enabled: false,
                    welcomeEnabled: false,
                    goodbyeEnabled: false,
                    welcome: null,
                    goodbye: null,
                    log: false,
                    testMode: false,
                    deleteDelay: 0,
                    notifyAdmins: false,
                    showPP: true,
                    showDate: true,
                    showTime: true,
                    showCount: true
                };
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • CONFIG RESET •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
All event settings restored to default.`
                );
            }

            if (option === 'clear') {
                cfg.welcome = null;
                cfg.goodbye = null;
                cfg.welcomeEnabled = false;
                cfg.goodbyeEnabled = false;
                fs.writeFileSync(path, JSON.stringify(db, null, 2));
                return reply('֎ Welcome and goodbye messages cleared.');
            }

            return await reply('֎ Invalid option. Use.events status for help.');
        } catch (e) {
            console.error('[XDN EVENTS ERROR]:', e);
            return await reply('֎ Something went wrong with the events system.');
        }
    }
};