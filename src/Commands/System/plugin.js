const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { registerCommand } = require('../../../src/Plugin/xdnCmd');

const PLUGINS_DIR = path.join(__dirname, '../../../plugins');
const PLUGINS_DB = path.join(__dirname, '../../../database/plugins.json');

// Ensure directories exist
if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(PLUGINS_DB))) fs.mkdirSync(path.dirname(PLUGINS_DB), { recursive: true });

let pluginsDB = {};
if (fs.existsSync(PLUGINS_DB)) {
    try { pluginsDB = JSON.parse(fs.readFileSync(PLUGINS_DB, 'utf8')); } catch {}
}

const savePluginsDB = () => {
    fs.writeFileSync(PLUGINS_DB, JSON.stringify(pluginsDB, null, 2));
};

const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https')? https : http;
        client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
};

const extractUrls = (text) => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
};

const installPlugin = async (url) => {
    try {
        if (!url.startsWith('http')) {
            return { success: false, error: 'Invalid URL' };
        }

        if (pluginsDB[url]) {
            return { success: false, error: `Already installed: ${pluginsDB[url].name}` };
        }

        const code = await fetchUrl(url);
        if (!code || code.length < 50) {
            return { success: false, error: 'Empty or invalid response' };
        }

        const nameMatch = code.match(/name:\s*['"]([^'"]+)['"]/);
        const categoryMatch = code.match(/category:\s*['"]([^'"]+)['"]/);

        if (!nameMatch) {
            return { success: false, error: 'No command name found in plugin' };
        }

        const cmdName = nameMatch[1];
        const category = categoryMatch? categoryMatch[1] : 'misc';
        const fileName = `${category}_${cmdName}_${Date.now()}.js`;
        const filePath = path.join(PLUGINS_DIR, fileName);

        fs.writeFileSync(filePath, code);

        try {
            delete require.cache[require.resolve(filePath)];
            const cmd = require(filePath);
            if (cmd.name && typeof cmd.execute === 'function') {
                registerCommand(cmd);
                console.log(`[XDN PLUGIN] Registered: ${cmd.name}`);
            }
        } catch (e) {
            console.error('[XDN PLUGIN] Register error:', e.message);
        }

        pluginsDB[url] = {
            name: cmdName,
            category: category,
            file: fileName,
            installedAt: Date.now()
        };
        savePluginsDB();

        return { success: true, name: cmdName, category: category };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

module.exports = {
    name: 'plugin',
    alias: ['install', 'addplugin', 'getplugin'],
    desc: 'Install external plugins with XDN defense core',
    category: 'owner',
    ownerOnly: true,
    usage: '.plugin <url>\n.plugin (reply to list of URLs)',
    reactions: { start: '📦', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        let urls = [];

        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text || '';

        if (quotedText) {
            urls = extractUrls(quotedText);
        }

        if (args.length > 0) {
            const argUrls = extractUrls(args.join(' '));
            urls = [...urls,...argUrls];
        }

        urls = [...new Set(urls)];

        if (urls.length === 0) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • PLUGIN INSTALL •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : NO URL
│ ❏ Usage :.plugin <url>
│ ❏ Or reply to URL list
╰─────────────────────────╯
Example:.plugin https://cdn.example.com/plugin.txt

> ֎`
            );
        }

        const results = [];
        for (const url of urls) {
            const result = await installPlugin(url);
            results.push({ url,...result });
        }

        const success = results.filter(r => r.success);
        const failed = results.filter(r =>!r.success);

        const successList = success.map(s => `│ ❏ ${s.name} [${s.category}]`).join('\n');
        const failedList = failed.map(f => {
            const shortUrl = f.url.split('/').pop()?.slice(0, 30) || f.url;
            return `│ ❏ ${shortUrl}: ${f.error}`;
        }).join('\n');

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • PLUGIN RESULTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Installed : ${success.length}
│ ❏ Failed : ${failed.length}
╰─────────────────────────╯
${success.length? `Success:\n${successList}\n` : ''}
${failed.length? `Failed:\n${failedList}\n` : ''}
Use.plugins to list all

> ֎`
        );
    }
};

module.exports.pluginsDB = pluginsDB;
module.exports.savePluginsDB = savePluginsDB;
module.exports.installPlugin = installPlugin;