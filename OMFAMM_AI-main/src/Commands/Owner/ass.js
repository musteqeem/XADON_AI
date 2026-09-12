const fs = require('fs');
const path = require('path');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const CONFIG_PATH = path.join(process.cwd(), 'database', 'autosavestatus.json');

// Default config
const defaultConfig = {
    enabled: false,
    mode: 'dm',        // 'dm' = owner DM, 'chat' = specific chat, 'number' = specific WhatsApp number
    target: null,      // JID for chat mode, or phone number string for number mode
};

// Load config
let config = { ...defaultConfig };
try {
    if (fs.existsSync(CONFIG_PATH)) {
        config = { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    }
} catch {}

function saveConfig() {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Get owner JID
function getOwnerJid() {
    const num = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
    return num ? `${num}@s.whatsapp.net` : null;
}

module.exports = {
    name: 'ass',
    alias: ['autosave', 'autostatus'],
    desc: 'Auto-save all statuses to a specified chat or DM',
    category: 'Owner',
    usage: '.ass on/off | .ass mode dm/chat/number | .ass set <number/chatJid> | .ass status',
    ownerOnly: true,

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        // --- ON / OFF ---
        if (sub === 'on') {
            config.enabled = true;
            saveConfig();
            return reply(`✓ Auto Save Status ENABLED`);
        }
        if (sub === 'off') {
            config.enabled = false;
            saveConfig();
            return reply(`✘ Auto Save Status DISABLED`);
        }

        // --- MODE ---
        if (sub === 'mode') {
            const mode = value.toLowerCase();
            if (!['dm', 'chat', 'number'].includes(mode)) {
                return reply(`✘ Invalid mode. Use: dm, chat, or number`);
            }
            config.mode = mode;
            saveConfig();
            return reply(`✓ Mode set to: *${mode.toUpperCase()}*`);
        }

        // --- SET TARGET ---
        if (sub === 'set') {
            if (!value) return reply(`✘ Provide a number e.g +234xxxxxxxx or a chat JID`);
            let target = value.trim();
            if (config.mode === 'number') {
                target = target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            } else if (config.mode === 'chat') {
                if (!target.includes('@')) target = target + '@g.us'; // assume group if missing
            }
            config.target = target;
            saveConfig();
            return reply(`✓ Target set to: *${target}*`);
        }

        // --- STATUS ---
        if (sub === 'status') {
            const modeDisplay = config.mode.toUpperCase();
            let targetDisplay = 'None';
            if (config.target) {
                if (config.mode === 'number') targetDisplay = config.target.split('@')[0];
                else targetDisplay = config.target;
            }
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO SAVE STATUS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CONFIG*
│ ❏ Status : ${config.enabled? 'ON' : 'OFF'}
│ ❏ Mode : ${modeDisplay}
│ ❏ Target : ${targetDisplay}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        // --- HELP ---
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO SAVE STATUS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏ ${prefix}ass on : Enable
│ ❏ ${prefix}ass off : Disable
│ ❏ ${prefix}ass mode dm : Save to owner DM
│ ❏ ${prefix}ass mode chat : Save to specific chat
│ ❏ ${prefix}ass mode number : Save to specific number
│ ❏ ${prefix}ass set <target> : Set chat JID or phone
│ ❏ ${prefix}ass status : Show current config
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    },

    // Exported config getter for use in status handler
    getConfig: () => config,
};