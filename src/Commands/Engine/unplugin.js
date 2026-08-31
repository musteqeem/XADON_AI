const fs = require('fs');
const path = require('path');
const { pluginsDB, savePluginsDB } = require('./plugin.js');

const PLUGINS_DIR = path.join(__dirname, '../../../plugins');

module.exports = {
    name: 'unplugin',
    alias: ['uninstall', 'removeplugin', 'delplugin'],
    desc: 'Uninstall an external plugin by name, URL, or reply to URL',
    category: 'Owner',
    ownerOnly: true,
    usage: '.unplugin <name>\n.unplugin <url>\n.unplugin (reply to URL)',
    reactions: { start: '🗑️', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } });

        let target;

        // MODE 1: Reply to a message with URL
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';

        if (quotedText) {
            const urlMatch = quotedText.match(/https?:\/\/[^\s]+/);
            target = urlMatch? urlMatch[0] : quotedText.trim();
        }
        // MODE 2: Direct argument
        else if (args.length > 0) {
            target = args.join(' ').trim();
        }
        // ERROR: Nothing provided
        else {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • UNINSTALL PLUGIN •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Provide plugin name, URL, or reply to URL
│
│ ❏ *USAGE*
│ •.unplugin <name>
│ •.unplugin <url>
│ •.unplugin (reply to URL)
│
│ ❏ *EXAMPLES*
│ •.unplugin ping
│ •.unplugin https://cdn.example.com/ping.js
╰─────────────────────────╯`
            );
        }

        if (!target) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • UNINSTALL PLUGIN •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Could not extract target
│
│ ❏ *NOTE*
│ • Use.plugins to see installed
╰─────────────────────────╯`
            );
        }

        // Search for the plugin
        let found = null;

        // 1. Search by exact URL
        if (pluginsDB[target]) {
            found = { url: target,...pluginsDB[target] };
        }

        // 2. Search by name
        if (!found) {
            for (const [url, info] of Object.entries(pluginsDB)) {
                if (info.name.toLowerCase() === target.toLowerCase()) {
                    found = { url,...info };
                    break;
                }
            }
        }

        // 3. Search by partial URL
        if (!found) {
            for (const [url, info] of Object.entries(pluginsDB)) {
                if (url.toLowerCase().includes(target.toLowerCase())) {
                    found = { url,...info };
                    break;
                }
            }
        }

        // 4. Search by filename
        if (!found) {
            for (const [url, info] of Object.entries(pluginsDB)) {
                if (info.file.toLowerCase().includes(target.toLowerCase())) {
                    found = { url,...info };
                    break;
                }
            }
        }

        if (!found) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • UNINSTALL PLUGIN •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ Target : ${target}
│
│ ❏ *NOTE*
│ • Check spelling or use.plugins
╰─────────────────────────╯`
            );
        }

        // Delete the file
        const filePath = path.join(PLUGINS_DIR, found.file);
        let fileDeleted = false;
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                fileDeleted = true;
            } catch (e) {
                console.error('[UNPLUGIN] File delete error:', e.message);
            }
        }

        // Remove from cache
        try {
            delete require.cache[require.resolve(filePath)];
        } catch {}

        // Remove from DB
        delete pluginsDB[found.url];
        savePluginsDB();

        await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • UNINSTALLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Plugin : ${found.name}
│ ❏ Category : ${found.category}
│ ❏ File : ${found.file}
│ ❏ Deleted : ${fileDeleted? 'Yes' : 'No (already gone)'}
│
│ ❏ *STATUS*
│ • Changes take effect immediately
╰─────────────────────────╯`
        );
    }
};