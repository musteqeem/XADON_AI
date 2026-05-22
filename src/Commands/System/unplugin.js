const fs = require('fs');
const path = require('path');
const { pluginsDB, savePluginsDB } = require('./plugin.js');

const PLUGINS_DIR = path.join(__dirname, '../../../plugins');

module.exports = {
    name: 'unplugin',
    alias: ['uninstall', 'removeplugin', 'delplugin'],
    desc: 'Uninstall an external plugin with XDN defense core',
    category: 'owner',
    ownerOnly: true,
    usage: '.unplugin <name>\n.unplugin <url>\n.unplugin (reply to URL)',
    reactions: { start: '🗑️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
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
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • UNPLUGIN USAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Usage :.unplugin <name>
│ ❏ Usage :.unplugin <url>
│ ❏ Usage :.unplugin (reply to URL)
│ ❏ Examples :
│.unplugin ping
│.unplugin https://cdn.example.com/ping.txt
╰─────────────────────────╯

> ֎`
            );
        }

        if (!target) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • UNPLUGIN ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : NO TARGET
│ ❏ Action : FAILED
╰─────────────────────────╯
Use.plugins to see installed

> ֎`
            );
        }

        // Search for the plugin
        let found = null;

        if (pluginsDB[target]) {
            found = { url: target,...pluginsDB[target] };
        }

        if (!found) {
            for (const [url, info] of Object.entries(pluginsDB)) {
                if (info.name.toLowerCase() === target.toLowerCase()) {
                    found = { url,...info };
                    break;
                }
            }
        }

        if (!found) {
            for (const [url, info] of Object.entries(pluginsDB)) {
                if (url.toLowerCase().includes(target.toLowerCase())) {
                    found = { url,...info };
                    break;
                }
            }
        }

        if (!found) {
            for (const [url, info] of Object.entries(pluginsDB)) {
                if (info.file.toLowerCase().includes(target.toLowerCase())) {
                    found = { url,...info };
                    break;
                }
            }
        }

        if (!found) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • NOT FOUND •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Target : ${target}
│ ❏ Status : NOT INSTALLED
╰─────────────────────────╯
Check spelling or use.plugins

> ֎`
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
                console.error('[XDN UNPLUGIN] File delete error:', e.message);
            }
        }

        // Remove from cache
        try {
            delete require.cache[require.resolve(filePath)];
        } catch {}

        // Remove from DB
        delete pluginsDB[found.url];
        savePluginsDB();

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • PLUGIN REMOVED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Name : ${found.name}
│ ❏ Category : ${found.category}
│ ❏ File : ${found.file}
│ ❏ Deleted : ${fileDeleted? 'YES' : 'NO (already gone)'}
│ ❏ Status : ACTIVE
╰─────────────────────────╯
Changes take effect immediately

> ֎`
        );
    }
};