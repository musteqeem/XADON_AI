const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const DB_PATH = path.join(__dirname, '../../../database/autoreact.json');

// Default emoji pool
const DEFAULT_EMOJIS = [
    '😂', '🔥', '👍', '❤️', '😍', '🎉', '👏', '🤔', '😎', '🥳', '✨', '💯', '🙏', '🐾', '⚠', '💘', '🎲', '📰', '🗞', '💌', '🤯', '🎊', '👌', '🛑', '😤', '📝', '😁', '🥰', '🥳', '😶‍🌫', '😱', '🥱', '🤭', '😮‍💨', '😫', '😩', '🤢', '🤮', '😵‍💫', '🥴', '🙊', '💫', '💥', '❤️‍🔥', '👀', '🫂', '🗣', '🙆', '🤳', '🖕'
];

// Load config
function loadConfig() {
    try {
        if (fs.existsSync(DB_PATH))
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {}
    return { enabled: false, emojis: DEFAULT_EMOJIS };
}

function saveConfig(config) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(config, null, 2));
}

module.exports = {
    name: 'autoreact',
    alias: ['randomreact'],
    category: 'Tools',
    desc: 'Auto-react to every message with a random emoji',
    usage: '.autoreact on/off |.autoreact list |.autoreact add <emoji> |.autoreact remove <emoji> |.autoreact reset',

    execute: async (sock, m, { args, reply, prefix }) => {
        const config = loadConfig();
        const cmd = args[0]?.toLowerCase();

        // Toggle ON/OFF
        if (cmd === 'on') {
            config.enabled = true;
            saveConfig(config);
            return reply(`✓ Auto-react ENABLED`);
        }
        if (cmd === 'off') {
            config.enabled = false;
            saveConfig(config);
            return reply(`✘ Auto-react DISABLED`);
        }

        // List current emojis
        if (cmd === 'list') {
            const emojis = config.emojis.join(' ');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO REACT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EMOJI POOL* [${config.emojis.length}]
│ ${emojis}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // Add emoji to pool
        if (cmd === 'add') {
            const emoji = args[1];
            if (!emoji ||!/^\p{Emoji}$/u.test(emoji)) return reply(`✘ Provide a valid emoji.`);
            if (config.emojis.includes(emoji)) return reply(`✘ Emoji already in pool.`);
            config.emojis.push(emoji);
            saveConfig(config);
            return reply(`✓ Added ${emoji} to pool.`);
        }

        // Remove emoji from pool
        if (cmd === 'remove') {
            const emoji = args[1];
            if (!emoji) return reply(`✘ Usage: ${prefix}autoreact remove <emoji>`);
            const index = config.emojis.indexOf(emoji);
            if (index === -1) return reply(`✘ Emoji not in pool.`);
            config.emojis.splice(index, 1);
            saveConfig(config);
            return reply(`✓ Removed ${emoji} from pool.`);
        }

        // Reset to default emojis
        if (cmd === 'reset') {
            config.emojis = [...DEFAULT_EMOJIS];
            saveConfig(config);
            return reply(`✓ Reset to default emojis.`);
        }

        // Show help
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO REACT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ State : ${config.enabled? 'ENABLED' : 'DISABLED'}
│
╭─֎ *COMMANDS*
│ ❏ ${prefix}autoreact on/off
│ ❏ ${prefix}autoreact list
│ ❏ ${prefix}autoreact add 🎈
│ ❏ ${prefix}autoreact remove 🎈
│ ❏ ${prefix}autoreact reset
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    },

    // Export helpers for message handler
    isEnabled: () => loadConfig().enabled,
    getRandomEmoji: () => {
        const config = loadConfig();
        const emojis = config.emojis;
        if (!emojis.length) return '👍';
        return emojis[Math.floor(Math.random() * emojis.length)];
    }
};