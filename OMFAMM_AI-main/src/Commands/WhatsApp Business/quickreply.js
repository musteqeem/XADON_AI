const config = require('../../../settings/config');
const fs = require('fs');
const path = require('path');

const BOT_NAME = config.botname || process.env.BOT_NAME || 'XADON AI';
const STORE_PATH = path.join(__dirname, '../../../data/quickreplies.json');

// ── Local store helpers ────────────────────────────────────────────
const loadStore = () => {
    try {
        if (fs.existsSync(STORE_PATH)) return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch {}
    return {};
};

const saveStore = (data) => {
    try {
        fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
        fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
    } catch {}
};

// ── Format one quick reply entry ───────────────────────────────────
const formatEntry = (shortcut, entry) =>
`❏ Shortcut : ${shortcut}
❏ Message : ${entry.message.slice(0, 150)}${entry.message.length > 150? '...' : ''}
❏ ID : ${entry.timestamp}`;

const USAGE = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} QUICK REPLY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMMANDS*
│ ❏.quickreply list : List all quick replies
│ ❏.quickreply add [shortcut] [message] : Add new
│ ❏.quickreply delete [id] : Delete by ID
╰─────────────────────────╯
╭─֎ *EXAMPLE*
│ ❏.quickreply add thanks Thank you for contacting us!
│ ❏.quickreply add price Our prices start from 5000 NGN
╰─────────────────────────╯
❏ Note: Only works on WhatsApp Business`;

module.exports = {
    name: 'quickreply',
    alias: ['qr', 'quickr', 'qreply'],
    desc: 'Manage business quick replies',
    category: 'Business',
    owner: true,
    usage: '.quickreply [add|delete|list]',

    execute: async (sock, m, { args, reply }) => {
        const action = args[0]?.toLowerCase();
        if (!action) return reply(USAGE);

        try {
            await sock.sendMessage(m.chat, { react: { text: '✐', key: m.key } });

            // ── LIST ───────────────────────────────────────────────
            if (action === 'list') {
                const store = loadStore();
                const entries = Object.entries(store);

                if (entries.length === 0) {
                    return reply(`✘ ֎ No quick replies saved yet.\n❏ Use:.quickreply add [shortcut] [message]`);
                }

                const lines = entries.map(([shortcut, entry]) => formatEntry(shortcut, entry)).join('\n\n─────────────────\n\n');

                return await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} QUICK REPLY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Total : ${entries.length} saved

${lines}`
                }, { quoted: m });
            }

            // ── ADD ────────────────────────────────────────────────
            if (action === 'add') {
                const shortcut = args[1];
                const message = args.slice(2).join(' ');

                if (!shortcut ||!message) {
                    return reply('✘ ֎ Usage:.quickreply add [shortcut] [message]');
                }

                if (shortcut.length > 25) return reply('✘ ֎ Shortcut max 25 characters');
                if (message.length > 1000) return reply('✘ ֎ Message max 1000 characters');

                const timestamp = String(Math.floor(Date.now() / 1000));

                await sock.addOrEditQuickReply({ shortcut, message, timestamp });

                // Save to local store
                const store = loadStore();
                store[shortcut] = { message, timestamp };
                saveStore(store);

                return await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} QUICK REPLY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Status : Added Successfully

${formatEntry(shortcut, { message, timestamp })}`
                }, { quoted: m });
            }

            // ── DELETE ─────────────────────────────────────────────
            if (action === 'delete') {
                const timestamp = args[1];
                if (!timestamp) return reply('✘ ֎ Usage:.quickreply delete [id]\n❏ Get the ID from.quickreply list');

                await sock.removeQuickReply(timestamp);

                // Remove from local store
                const store = loadStore();
                const shortcut = Object.keys(store).find(k => store[k].timestamp === timestamp);
                if (shortcut) delete store[shortcut];
                saveStore(store);

                return await sock.sendMessage(m.chat, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} QUICK REPLY •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Action : Deleted
❏ ID : ${timestamp}${shortcut? `\n❏ Shortcut : ${shortcut}` : ''}
❏ Status : Removed Successfully`
                }, { quoted: m });
            }

            return reply(USAGE);

        } catch (err) {
            console.error('[QUICKREPLY ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Quick Reply Error\n❏ Error: ${err.message}`);
        } finally {
            await sock.sendMessage(m.chat, { react: { text: "✓", key: m.key } });
        }
    }
};