const axios = require('axios');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

module.exports = {
    name: 'codeai',
    alias: ['advancedcode', 'codegen'],
    desc: 'Generate advanced code with AI - any language',
    category: 'AI',
    usage: '.codeai <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const prompt = args.join(' ').trim();

        if (!prompt) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Usage :.codeai <prompt>\n❏ Example :.codeai create a whatsapp bot login system in nodejs`);
        }

        await sock.sendMessage(jid, { react: { text: "💻", key: m.key } });

        try {
            const apiUrl = `${GATEWAY_URL}/ai/code-advanced?token=${GATEWAY_TOKEN}&text=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(apiUrl, { timeout: 90000 }); // 90s for code
            
            let code = data?.code || data?.result || data?.response || data?.output || data?.text || data;
            
            if (typeof code === 'object' && code !== null) {
                code = code.content || code.code || code.result || JSON.stringify(code, null, 2);
            }
            
            if (!code || code === '[object Object]') {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ No code generated.`);
            }

            // Detect language from prompt
            const lang = prompt.toLowerCase().includes('python') ? 'python' : 
                         prompt.toLowerCase().includes('js') ? 'javascript' :
                         prompt.toLowerCase().includes('html') ? 'html' :
                         prompt.toLowerCase().includes('php') ? 'php' : 'text';

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CODE GENERATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            // Split if code is too long for WA
            if (code.length > 3500) {
                await sock.sendMessage(jid, {
                    text: `${header}\n╭─֎ *Prompt:* ${prompt}\n│\n│ ֎ *Code too long, sending as document...*\n╰─────────────────────────╯`
                }, { quoted: m });

                await sock.sendMessage(jid, {
                    document: Buffer.from(code),
                    mimetype: 'text/plain',
                    fileName: `code_${Date.now()}.${lang === 'text' ? 'txt' : lang}`,
                    caption: `֎ Generated Code for: ${prompt}`
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    text: `${header}\n╭─֎ *Prompt:* ${prompt}\n│\n│ ֎ *Code:*\n│ \`\`\`${lang}\n${code}\n\`\`\`\n╰─────────────────────────╯\n⚡ Powered by Crysnova Gateway`
                }, { quoted: m });
            }
            
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[CODEAI ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (err.response?.status === 429) {
                return reply(`𓉤 ֎ Rate limit hit. Try again later.`);
            }
            if (err.code === 'ECONNABORTED') {
                return reply(`𓉤 ֎ Code generation timed out. Try a simpler prompt.`);
            }
            reply(`✘ ֎ Code generation failed\n❏ Error : ${err.message}`);
        }
    }
};