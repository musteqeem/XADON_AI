const fs = require('fs');
const path = require('path');
const { getTimezone, getTimeData } = require('../Core/®.js'); // fix path if different

const ENV_PATH = path.join(__dirname, '../../.env');

const getUserTimezone = (jid) => {
    const envKey = 'USER_TZ_' + jid.replace(/[^a-zA-Z0-9]/g, '_');

    if (process.env[envKey]) return process.env[envKey];

    const tzFile = path.join(__dirname, '../../database/timezones.json');
    if (fs.existsSync(tzFile)) {
        const data = JSON.parse(fs.readFileSync(tzFile, 'utf8'));
        if (data[jid]) return data[jid];
    }
    return 'Lagos';
};

const saveUserTimezone = (jid, timezone) => {
    const tzFile = path.join(__dirname, '../../database/timezones.json');
    const data = fs.existsSync(tzFile)? JSON.parse(fs.readFileSync(tzFile, 'utf8')) : {};

    data[jid] = timezone;
    fs.writeFileSync(tzFile, JSON.stringify(data, null, 2));

    const envKey = 'USER_TZ_' + jid.replace(/[^a-zA-Z0-9]/g, '_');
    let envContent = fs.existsSync(ENV_PATH)? fs.readFileSync(ENV_PATH, 'utf8') : '';

    envContent = envContent.replace(new RegExp(envKey + '=.*\n?', 'g'), '');
    envContent += '\n' + envKey + '=' + timezone + '\n';
    fs.writeFileSync(ENV_PATH, envContent);
};

module.exports = {
    name: 'uptime',
    alias: ['up'],
    desc: 'Show bot uptime with your local time',
    category: 'Info',
    usage: '.uptime',
    reactions: {
        start: '📡',
        success: '֎'
    },

    execute: async (sock, m, { reply }) => {
        try {
            const jid = m.sender || m.key?.remoteJid || m.message?.extendedTextMessage?.contextInfo?.participant;
            const userTz = getUserTimezone(jid);
            const timezone = getTimezone(userTz) || 'Africa/Lagos';

            let currentTime;
            try {
                const { data } = await getTimeData(timezone);
                const date = new Date(data.datetime);
                currentTime = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: timezone
                });
            } catch (e) {
                currentTime = new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
            }

            const uptimeSec = Math.floor(process.uptime());
            const days = Math.floor(uptimeSec / 86400);
            const hours = Math.floor((uptimeSec % 86400) / 3600);
            const minutes = Math.floor((uptimeSec % 3600) / 60);
            const seconds = uptimeSec % 60;

            const uptimeStr = `${days}d-${hours}h-${minutes}m-${seconds}s`;

            const text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • XDN UPTIME SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SYSTEM STATUS*
│ ❏ Uptime : \`${uptimeStr}\`
│ ❏ Time : \`${currentTime} [${userTz}]\`
│ ❏ Core : ONLINE
╰─────────────────────────╯`;

            await reply(text);
        } catch (err) {
            console.error('[XDN UPTIME ERROR]', err);
            reply('֎ Failed to get uptime');
        }
    }
};