const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../database/autoreact.json');

const DEFAULT_EMOJIS = [
    '😂', '🔥', '👍', '❤️', '😍', '🎉', '👏', '🤔', '😎', '🥳', '✨', '💯', '🙏', '🐾', '⚠️', '💘', '🎲', '📰', '🗞️', '💌', '🤯', '🎊', '👌', '🛑', '😤', '📝', '😁', '🥰', '🥳', '😶‍🌫️', '😱', '🥱', '🤭', '😮‍💨', '😫', '😩', '🤢', '🤮', '😵‍💫', '🥴', '🙊', '💫', '💥', '❤️‍🔥', '👀', '🫂', '🗣️', '🙆', '🤳', '🖕'
];

function loadConfig() {
    try {
        if (fs.existsSync(DB_PATH))
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {}
    return { enabled: false, emojis: DEFAULT_EMOJIS, settings: {} };
}

function saveConfig(config) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
    name: 'autoreact',
    alias: ['randomreact', 'ar'],
    category: 'tools',
    desc: 'Auto-react system with XDN defense core',
    reactions: { start: '🎯', success: '֎' },
    usage: '.autoreact on/off',

    execute: async (sock, m, { args, reply }) => {
        const config = loadConfig();
        const cmd = args[0]?.toLowerCase();

        if (!cmd || cmd === 'status') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTOREACT STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${config.enabled? 'ON' : 'OFF'}
│ ❏ Emoji Pool : ${config.emojis.length}
│ ❏ Mode : ${config.settings.mode || 'RANDOM'}
╰─────────────────────────╯

Commands:
֎.autoreact on/off → Toggle system
֎.autoreact list → Show emoji pool
֎.autoreact add <emoji> → Add emoji
֎.autoreact remove <emoji> → Remove emoji
֎.autoreact reset → Reset to default
֎.autoreact mode random/seq/first → Set mode
֎.autoreact limit <num> → Limit reactions
֎.autoreact exclude @user → Exclude user
֎.autoreact include @user → Include user
֎.autoreact cooldown <time> → Set cooldown
֎.autoreact export → Export config
֎.autoreact import JSON → Import config`
            );
        }

        if (cmd === 'on') {
            config.enabled = true;
            saveConfig(config);
            return reply('֎ Auto-react ENABLED. Defense core active.');
        }

        if (cmd === 'off') {
            config.enabled = false;
            saveConfig(config);
            return reply('֎ Auto-react DISABLED.');
        }

        if (cmd === 'list') {
            const emojis = config.emojis.join(' ');
            return reply(
`֎ *Emoji Pool [${config.emojis.length}]*
${emojis}`
            );
        }

        if (cmd === 'add') {
            const emoji = args[1];
            if (!emoji ||!/^\p{Emoji}$/u.test(emoji)) return reply('֎ Provide a valid emoji.');
            if (config.emojis.includes(emoji)) return reply('֎ Emoji already in pool.');
            config.emojis.push(emoji);
            saveConfig(config);
            return reply(`֎ Added ${emoji} to pool.`);
        }

        if (cmd === 'remove') {
            const emoji = args[1];
            if (!emoji) return reply('֎ Usage:.autoreact remove <emoji>');
            const index = config.emojis.indexOf(emoji);
            if (index === -1) return reply('֎ Emoji not in pool.');
            config.emojis.splice(index, 1);
            saveConfig(config);
            return reply(`֎ Removed ${emoji} from pool.`);
        }

        if (cmd === 'reset') {
            config.emojis = [...DEFAULT_EMOJIS];
            saveConfig(config);
            return reply('֎ Reset to default emoji pool.');
        }

        if (cmd === 'mode') {
            const mode = args[1]?.toLowerCase();
            if (!['random', 'seq', 'first'].includes(mode)) return reply('֎ Mode: random, seq, first');
            config.settings.mode = mode;
            saveConfig(config);
            return reply(`֎ Mode set to ${mode.toUpperCase()}.`);
        }

        if (cmd === 'limit') {
            const limit = parseInt(args[1]);
            if (!limit || limit < 1) return reply('֎ Usage:.autoreact limit 5');
            config.settings.limit = limit;
            saveConfig(config);
            return reply(`֎ Limit set to ${limit} reactions per message.`);
        }

        if (cmd === 'exclude') {
            const user = m.mentionedJid?.[0];
            if (!user) return reply('֎ Usage:.autoreact exclude @user');
            config.settings.exclude = config.settings.exclude || [];
            if (!config.settings.exclude.includes(user)) config.settings.exclude.push(user);
            saveConfig(config);
            return reply(`֎ Excluded @${user.split('@')[0]} from autoreact.`, { mentions: [user] });
        }

        if (cmd === 'include') {
            const user = m.mentionedJid?.[0];
            if (!user) return reply('֎ Usage:.autoreact include @user');
            config.settings.exclude = config.settings.exclude || [];
            config.settings.exclude = config.settings.exclude.filter(u => u!== user);
            saveConfig(config);
            return reply(`֎ Included @${user.split('@')[0]} in autoreact.`, { mentions: [user] });
        }

        if (cmd === 'cooldown') {
            const timeStr = args[1];
            if (!timeStr) return reply('֎ Usage:.autoreact cooldown 5s');
            const ms = parseTime(timeStr);
            if (!ms) return reply('֎ Invalid time. Use 5s, 1m, 1h');
            config.settings.cooldown = ms;
            saveConfig(config);
            return reply(`֎ Cooldown set to ${formatTime(ms)}.`);
        }

        if (cmd === 'export') {
            const data = JSON.stringify(config, null, 2);
            return reply(
`֎ *AutoReact Export*
\`\`json
${data}
\`\``
            );
        }

        if (cmd === 'import') {
            const jsonStr = args.slice(1).join(' ');
            if (!jsonStr) return reply('֎ Usage:.autoreact import {\"key\":\"value\"}');
            try {
                const obj = JSON.parse(jsonStr);
                Object.assign(config, obj);
                saveConfig(config);
                return reply('֎ Config imported successfully.');
            } catch {
                return reply('֎ Invalid JSON format.');
            }
        }

        return reply('֎ Unknown subcommand. Use.autoreact status for help.');
    },

    isEnabled: () => loadConfig().enabled,

    getRandomEmoji: () => {
        const config = loadConfig();
        const emojis = config.emojis;
        if (!emojis.length) return '👍';

        const mode = config.settings?.mode || 'random';
        if (mode === 'first') return emojis[0];
        if (mode === 'seq') {
            config.settings.index = config.settings.index || 0;
            const emoji = emojis[config.settings.index % emojis.length];
            config.settings.index++;
            saveConfig(config);
            return emoji;
        }
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
};

function parseTime(str) {
    const match = str?.match(/^(\d+)(s|m|h)$/i);
    if (!match) return null;
    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const map = { s: 1000, m: 60000, h: 3600000 };
    return num * map[unit];
}

function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}