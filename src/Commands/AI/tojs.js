const axios = require("axios");
const config = require("../../../settings/config");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

// ORIGINAL + 3 PUBLIC CODE CONVERSION APIs
const TOJS_APIS = [
    {
        name: 'Xadon Gateway',
        convert: async (code) => {
            const apiUrl = `${GATEWAY_URL}/tools/tojavascript?token=${encodeURIComponent(GATEWAY_TOKEN)}&code=${encodeURIComponent(code)}&from=auto`;
            const res = await axios.get(apiUrl, { timeout: 30000 });
            return res.data?.result || res.data?.code || '';
        }
    },
    {
        name: 'Pollinations AI',
        convert: async (code) => {
            const prompt = `Convert this code to clean, modern JavaScript. Only return the JS code with no explanation.\n\nCode:\n${code}`;
            const res = await axios.post('https://text.pollinations.ai/', {
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o'
            }, { timeout: 45000 });
            return res.data || '';
        }
    },
    {
        name: 'DeepAI Code',
        convert: async (code) => {
            const prompt = `Convert this code to JavaScript:\n${code}`;
            const res = await axios.post('https://api.deepai.org/api/chat', {
                text: prompt
            }, {
                headers: { 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                timeout: 45000
            });
            return res.data?.output || '';
        }
    },
    {
        name: 'Cohere AI',
        convert: async (code) => {
            const prompt = `Convert the following code to JavaScript. Return only code:\n${code}`;
            const res = await axios.post('https://api.cohere.ai/v1/chat', {
                message: prompt,
                model: 'command-r'
            }, {
                headers: { 'Authorization': 'Bearer free-trial-key' },
                timeout: 45000
            });
            return res.data?.text || '';
        }
    }
];

module.exports = {
    name: 'tojs',
    alias: ['toj', 'convertjs', 'jsify', 'js'],
    category: 'AI',
    desc: `${BOT_NAME} Convert any code to clean JavaScript with 4 API fallbacks`,
    usage: '.tojs <code> |.tojs (reply to code)',
    owner: false,

    execute: async (sock, m, { args, reply, quoted }) => {
        const jid = m.key.remoteJid;

        // Support input from args or quoted message
        let inputCode = args.join(' ');
        if (!inputCode && m.quoted?.text) inputCode = m.quoted.text;
        if (!inputCode) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Please provide code to convert\n❏ Usage:.tojs <code> or reply to code`);
        }

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: '🔁', key: m.key } });
        await reply(`❏ *Converting to JavaScript...*`);

        let jsOutput = '';
        let sourceUsed = '';

        // Try all 4 APIs - CRYSNOVA FIRST
        for (let i = 0; i < TOJS_APIS.length; i++) {
            try {
                console.log(`[TOJS] Trying ${TOJS_APIS[i].name}`);
                jsOutput = await TOJS_APIS[i].convert(inputCode);
                if (jsOutput && jsOutput.trim().length > 3) {
                    sourceUsed = TOJS_APIS[i].name;
                    break;
                }
            } catch (e) {
                console.log(`[TOJS] ${TOJS_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!jsOutput || jsOutput.trim().length < 3) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Unable to convert code\n❏ All 4 APIs failed`);
        }

        jsOutput = jsOutput.trim();

        const MAX_CHARS = 4000;
        if (jsOutput.length > MAX_CHARS) {
            const parts = Math.ceil(jsOutput.length / MAX_CHARS);
            for (let i = 0; i < jsOutput.length; i += MAX_CHARS) {
                const partNum = Math.floor(i / MAX_CHARS) + 1;
                await sock.sendMessage(jid, {
                    text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} CONVERTED JS (${partNum}/${parts}) •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n\`\`\`js\n${jsOutput.slice(i, i + MAX_CHARS)}\n\`\n\n❏ Source: ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
                }, { quoted: m });
            }
        } else {
            await sock.sendMessage(jid, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} CONVERTED JAVASCRIPT •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n\`\`\`js\n${jsOutput}\n\`\`\`\n\n❏ Source: ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

    } catch (err) {
        console.error('[TOJS ERROR]', err.message);
        await sock.sendMessage(jid, { react: { text: '✘', key: m.key } });
        reply(`✘ ❏ Failed to convert code\n❏ ${err.message}`);
    }
}
};