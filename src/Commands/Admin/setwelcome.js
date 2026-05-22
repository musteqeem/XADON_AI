const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, '../../../database/groupEvents.json');

const readDB = () => {
    try { return JSON.parse(fs.readFileSync(dbFile)); }
    catch { return {}; }
};

const writeDB = (d) => {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    fs.writeFileSync(dbFile, JSON.stringify(d, null, 2));
};

const replaceVars = (text, data) => {
    return text
     .replace(/@user/g, data.user || '')
     .replace(/@name/g, data.name || 'User')
     .replace(/@tag/g, data.tag || '@user')
     .replace(/@pp/g, data.pp || '')
     .replace(/@gpp/g, data.gpp || '')
     .replace(/@group/g, data.group || 'Group')
     .replace(/@groupid/g, data.groupid || '')
     .replace(/@desc/g, data.desc || '')
     .replace(/@count/g, data.count || '0')
     .replace(/@admins/g, data.admins || '0')
     .replace(/@date/g, data.date || new Date().toLocaleDateString())
     .replace(/@time/g, data.time || new Date().toLocaleTimeString())
     .replace(/@id/g, data.id || '')
     .replace(/@owner/g, data.owner || '')
     .replace(/@reason/g, data.reason || 'Joined')
     .replace(/@bot/g, data.bot || 'XDN Bot')
     .replace(/@prefix/g, data.prefix || '.')
     .replace(/@version/g, data.version || '1.0')
     .replace(/@total/g, data.total || '0')
     .replace(/@online/g, data.online || '0');
};

module.exports = {
    name: 'setwelcome',
    alias: ['welcome', 'setwel'],
    desc: 'Set welcome message with 20 dynamic parameters',
    category: 'Admin',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🎉', success: '֎' },

    execute: async (sock, m, { args, text, reply }) => {
        const sub = args[0]?.toLowerCase();
        const db = readDB();
        if (!db[m.chat]) db[m.chat] = {};

        if (!sub || sub === 'status') {
            const status = db[m.chat].welcomeEnabled? 'ACTIVE' : 'INACTIVE';
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME SYSTEM STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${status}
│ ❏ Message : ${db[m.chat].welcome? 'SET' : 'NOT SET'}
╰─────────────────────────╯

Available Parameters:
֎ @user @name @tag @pp @gpp
֎ @group @groupid @desc @count @admins
֎ @date @time @id @owner @reason
֎ @bot @prefix @version @total @online

Usage:
֎.setwelcome on/off → Toggle system
֎.setwelcome <text> → Set welcome message
֎.setwelcome test → Test message
֎.setwelcome clear → Clear message
֎.setwelcome params → Show all parameters`
            );
        }

        if (sub === 'on') {
            db[m.chat].welcomeEnabled = true;
            writeDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME SYSTEM ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Welcome messages are now ENABLED.`
            );
        }

        if (sub === 'off') {
            db[m.chat].welcomeEnabled = false;
            writeDB(db);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME SYSTEM DEACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Welcome messages are now DISABLED.`
            );
        }

        if (sub === 'clear') {
            db[m.chat].welcome = null;
            db[m.chat].welcomeEnabled = false;
            writeDB(db);
            return reply('֎ Welcome message cleared and disabled.');
        }

        if (sub === 'params') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME PARAMETERS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USER DATA*
│ ❏ @user → Mentions user
│ ❏ @name → User name
│ ❏ @tag → @user tag
│ ❏ @pp → User profile pic
│ ❏ @id → User JID
╰─────────────────────────╯
╭─֎ *GROUP DATA*
│ ❏ @group → Group name
│ ❏ @gpp → Group profile pic
│ ❏ @groupid → Group JID
│ ❏ @desc → Group description
│ ❏ @count → Member count
│ ❏ @admins → Admin count
│ ❏ @owner → Group owner
│ ❏ @total → Total members
│ ❏ @online → Online members
╰─────────────────────────╯
╭─֎ *TIME & SYSTEM*
│ ❏ @date → Current date
│ ❏ @time → Current time
│ ❏ @reason → Join reason
│ ❏ @bot → Bot name
│ ❏ @prefix → Bot prefix
│ ❏ @version → Bot version
╰─────────────────────────╯`
            );
        }

        if (sub === 'test') {
            const testData = {
                user: m.sender,
                name: 'TestUser',
                tag: '@TestUser',
                pp: 'https://example.com/pp.jpg',
                gpp: 'https://example.com/gpp.jpg',
                group: 'Test Group',
                groupid: m.chat,
                desc: 'Test Description',
                count: '100',
                admins: '5',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                id: m.sender,
                owner: m.chat.split('@')[0] + '@s.whatsapp.net',
                reason: 'Joined',
                bot: 'XDN Bot',
                prefix: '.',
                version: '1.0',
                total: '100',
                online: '20'
            };

            if (!db[m.chat].welcome) {
                return reply('֎ No welcome message set. Use.setwelcome <text> first.');
            }

            const preview = replaceVars(db[m.chat].welcome, testData);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME PREVIEW •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
${preview}`
            );
        }

        if (!text) {
            return reply(
`֎ Usage:.setwelcome <message>

Example:
.setwelcome Welcome @user to @group!
You are member number @count.

Type.setwelcome params to see all 20 parameters.`
            );
        }

        db[m.chat].welcomeEnabled = true;
        db[m.chat].welcome = text;
        writeDB(db);

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • WELCOME MESSAGE SET •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Message saved and system ENABLED.

Type.setwelcome test to preview.`
        );
    }
};