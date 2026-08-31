const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../../../settings/config');
const { getAll } = require('../../Plugin/crysCmd.js');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

const SYSTEM_PROMPT = `You are a senior WhatsApp bot developer building plugins for ${BOT_NAME}.
The bot uses @musteqeem/baileys library. Output ONLY raw JavaScript code. No markdown. No backticks. No explanation.
Plugin format MUST be exactly:
module.exports = {
    name: 'commandname',
    alias: ['alias1'],
    desc: 'Short description',
    category: 'Tools',
    execute: async (sock, m, { args, text, reply, prefix, isOwner, isSudo, isAdmin, isGroup, groupMeta }) => {
        // your code here
    }
};
STRICT RULES:
1. Use built-in fetch() for all HTTP requests — no axios
2. Use reply(text) to respond — never sock.sendMessage directly unless sending media
3. Always wrap in try/catch with proper error messages
4. Make the code production-ready, clean, and fully working
5. Handle edge cases (no input, API errors, empty results)
6. For media: await sock.sendMessage(m.chat, { image: buffer, caption: text }, { quoted: m })
7. Available: fs, path, Buffer — no other external packages
8. The command name must exactly match what is requested
9. Output ONLY the JS module code — nothing before, nothing after`;

// 3 CODE GENERATION APIs
const CODE_APIS = [
    {
        name: 'Xadon Gateway',
        generate: async (prompt) => {
            const res = await axios.get(`${GATEWAY_URL}/ai/code-advanced?token=${encodeURIComponent(GATEWAY_TOKEN)}&text=${encodeURIComponent(prompt)}`, { timeout: 60000 });
            const data = res.data;
            return data?.code || data?.result || data?.response || JSON.stringify(data);
        }
    },
    {
        name: 'Pollinations AI',
        generate: async (prompt) => {
            const res = await axios.post('https://text.pollinations.ai/', {
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o'
            }, { timeout: 45000 });
            return res.data || '';
        }
    },
    {
        name: 'DeepAI Code',
        generate: async (prompt) => {
            const res = await axios.post('https://api.deepai.org/api/chat', { text: prompt }, {
                headers: { 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                timeout: 45000
            });
            return res.data?.output || '';
        }
    }
];

async function chatWithAI(prompt) {
    const res = await axios.post(`${GATEWAY_URL}/chat?token=${encodeURIComponent(GATEWAY_TOKEN)}`, {
        prompt, model: 'gpt-4.5'
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
    return res.data?.response || res.data?.result || res.data?.text || '';
}

const forceRegister = (plugin) => {
    const all = getAll();
    const name = plugin.name.toLowerCase();
    all.set(name, plugin);
    if (Array.isArray(plugin.alias)) {
        for (const a of plugin.alias) all.set(a.toLowerCase(), plugin);
    }
};

const hotLoad = (filePath, source = 'Generated') => {
    delete require.cache[require.resolve(filePath)];
    const plugin = require(filePath);
    if (!plugin?.name ||!plugin?.execute) throw new Error('Invalid plugin — missing name or execute');
    plugin.source = source;
    forceRegister(plugin);
    return plugin.name;
};

// MAIN XM COMMAND
module.exports = {
    name: 'xm',
    alias: ['xcreate', 'aicommand'],
    desc: `${BOT_NAME} AI generates and hot-installs a new command instantly`,
    category: 'Owner',
    sudoOnly: true,
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(
            `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} AI COMMAND CREATOR •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏.xm command|name|description\n│ \n│ ❏ *Examples:*\n│ ❏.xm command|weather|get current weather for any city\n│ ❏.xm command|joke|fetch a random programming joke\n│ \n│ ❏ *Note:* The AI builds and installs it instantly. No restart needed.\n╰─────────────────────────╯`
        );

        const parts = text.split('|').map(p => p.trim());
        if (parts.length < 3 || parts[0].toLowerCase()!== 'command') {
            return reply(`✘ ❏ Wrong format\n*Correct:*.xm command|<name>|<what it does>\n*Example:*.xm command|meme|fetch a random meme`);
        }

        const cmdName = parts[1].toLowerCase().replace(/[^a-z0-9]/g, '');
        const cmdDesc = parts.slice(2).join('|');

        if (!cmdName) return reply(`✘ ❏ Command name is invalid`);
        if (!cmdDesc) return reply(`✘ ❏ Please describe what the command should do`);

        const loading = await sock.sendMessage(m.chat, { text: `❏ *CODING...*` }, { quoted: m });

        try {
            const prompt = `${SYSTEM_PROMPT}\n\nBuild a WhatsApp bot command named "${cmdName}".\nWhat it must do: ${cmdDesc}\n\nCommand name: ${cmdName}`;

            let code = '';
            for (const api of CODE_APIS) {
                try {
                    console.log(`[XM] Trying ${api.name}`);
                    code = await api.generate(prompt);
                    if (code && code.length > 50) break;
                } catch (e) { console.log(`[XM] ${api.name} failed:`, e.message); }
            }

            if (!code || code.length < 50) throw new Error('AI returned insufficient code');

            code = code.replace(/^```(?:javascript|js)?\n?/im, '').replace(/\n?```\s*$/im, '').trim();
            if (!code.includes('module.exports')) throw new Error('AI did not produce a valid plugin module');
            if (!code.includes('execute')) throw new Error('Plugin is missing execute function');

            const cmdDir = path.join(process.cwd(), 'Plugin', 'Commands');
            if (!fs.existsSync(cmdDir)) fs.mkdirSync(cmdDir, { recursive: true });
            const filePath = path.join(cmdDir, `${cmdName}.js`);
            fs.writeFileSync(filePath, code, 'utf8');

            const loadedName = hotLoad(filePath);
            if (loading?.key) await sock.sendMessage(m.chat, { delete: loading.key }).catch(() => {});

            await sock.sendMessage(m.chat, {
                text: `✓ *SUCCESS!*\n\n❏ Command *${loadedName}* is now live\n❏ _Use it right now — no reload needed_`
            }, { quoted: m });

        } catch (err) {
            try {
                const filePath = path.join(process.cwd(), 'Plugin', 'Commands', `${cmdName}.js`);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch {}
            if (loading?.key) await sock.sendMessage(m.chat, { delete: loading.key }).catch(() => {});
            await sock.sendMessage(m.chat, { text: `✘ *CODING FAILED*\n\n_${err.message}_` }, { quoted: m });
        }
    }
};

// FETCH IMAGE COMMAND
const fetchImageCmd = {
    name: 'fetchimage',
    alias: ['fi', 'imgfetch', 'searchimage'],
    desc: 'Search and fetch images from the web',
    category: 'Search',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`🖼️ *Fetch Image*\n\nUsage:.fetchimage <query>\nExample:.fetchimage sunset beach`);
        await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } }).catch(() => {});
        try {
            const query = encodeURIComponent(text.trim());
            const vqdRes = await fetch(`https://duckduckgo.com/?q=${query}&iax=images&ia=images`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await vqdRes.text();
            const vqd = html.match(/vqd=([0-9-]+)/);
            if (!vqd) throw new Error('Could not initialize image search');

            const imgRes = await fetch(`https://duckgo.com/i.js?q=${query}&o=json&p=1&s=0&u=bing&f=,,,&l=us-en&vqd=${vqd[1]}`, { headers: { 'Referer': 'https://duckduckgo.com/', 'User-Agent': 'Mozilla/5.0' } });
            if (!imgRes.ok) throw new Error('Image search request failed');
            const data = await imgRes.json();
            const results = (data?.results || []).map(r => r?.image);
            if (!results.length) return reply(`✘ ❏ No images found for: *${text}*`);

            const randomImg = results[Math.floor(Math.random() * Math.min(5, results.length))];
            const imgFetch = await fetch(randomImg, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (!imgFetch.ok) throw new Error('Failed to download image');
            const buffer = Buffer.from(await imgFetch.arrayBuffer());
            const mimetype = imgFetch.headers.get('content-type') || 'image/jpeg';

            await sock.sendMessage(m.chat, { image: buffer, mimetype, caption: `🖼️ *${text}*\n_Source: ${randomImg || 'Web'}_` }, { quoted: m });
        } catch (err) {
            reply(`✘ ❏ Image fetch failed\n_${err.message}_`);
        }
    }
};

// FETCH WEB COMMAND
const fetchWebCmd = {
    name: 'fetchweb',
    alias: ['fw', 'websearch', 'search'],
    desc: 'Search the web and get an AI-summarized answer',
    category: 'Search',
    execute: async (sock, m, { text, reply }) => {
        if (!text) return reply(`🌐 *Fetch Web*\n\nUsage:.fetchweb <query>\nExample:.fetchweb latest news on AI`);
        await sock.sendMessage(m.chat, { react: { text: '🌐', key: m.key } }).catch(() => {});
        const loading = await sock.sendMessage(m.chat, { text: `❏ *SEARCHING...*` }, { quoted: m });
        try {
            const query = encodeURIComponent(text.trim());
            const res = await fetch(`https://api.duckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1&skip_disambig=1`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const data = await res.json();

            let summary = '';
            if (data?.AbstractText) summary += data.AbstractText + '\n';
            if (data?.RelatedTopics?.length) {
                const topics = data.RelatedTopics.slice(0, 5).map(t => t?.Text).filter(Boolean).join('\n');
                summary += topics;
            }
            if (!summary.trim()) summary = `The user searched for: "${text}". Provide a helpful, accurate, concise answer based on your knowledge.`;

            const aiPrompt = `Based on this web search for "${text}", provide a clear and helpful answer:\n\n${summary}`;
            const aiAnswer = await chatWithAI(aiPrompt);

            if (loading?.key) await sock.sendMessage(m.chat, { delete: loading.key }).catch(() => {});
            await sock.sendMessage(m.chat, { text: `🌐 *${text}*\n\n${aiAnswer}\n\n_Powered by ${BOT_NAME}_` }, { quoted: m });
        } catch (err) {
            if (loading?.key) await sock.sendMessage(m.chat, { delete: loading.key }).catch(() => {});
            reply(`✘ ❏ Search failed\n_${err.message}_`);
        }
    }
};

// Auto register the 2 helper commands
(function registerAll() {
    try { forceRegister(fetchImageCmd); } catch {}
    try { forceRegister(fetchWebCmd); } catch {}
})();