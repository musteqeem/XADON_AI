const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://apis.prexzyvilla.site/ai/code-advanced';

function chunkText(text, size = 3500) {
    const chunks = [];
    for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
    return chunks;
}

function isJsPrompt(text = '') {
    const t = text.toLowerCase().trim();
    return (
        t.includes('javascript') || t.includes('node') || t.includes('js') ||
        t.includes('baileys') || t.includes('command') || t.includes('bot') ||
        t.includes('whatsapp') || t.includes('module.exports') || t.includes('require(') ||
        t.includes('sock.sendmessage')
    );
}

function stripMarkdown(text = '') {
    return String(text).replace(/^```(?:js|javascript)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function extractPureCode(text = '') {
    text = stripMarkdown(text);
    const lines = text.split('\n');
    let start = lines.findIndex(line => /^(const|let|var|async function|function|class|module\.exports\b)/.test(line.trim()));
    const moduleIndex = lines.findIndex(line => /module\.exports\s*=/.test(line));
    if (moduleIndex !== -1) {
        const requireIndex = lines.findIndex((line, i) => i <= moduleIndex && /^(const|let|var)\s+\w+\s*=\s*require\(/.test(line.trim()));
        if (requireIndex !== -1) start = requireIndex;
        else if (start === -1) start = moduleIndex;
    }
    if (start > 0) text = lines.slice(start).join('\n').trim();
    return text.trim();
}

function looksLikeCommandCode(text = '') {
    const t = String(text);
    return /module\.exports\s*=/.test(t) && /execute\s*:\s*async/.test(t);
}

function buildSuperPrompt(task) {
    return [
        'XADON AI SUPER MODE',
        'Return only raw JavaScript code.',
        'No explanation. No markdown. No backticks. No comments.',
        'The reply must be a complete runnable bot command file.',
        'The first line must start with const or module.exports.',
        'Use CommonJS only.',
        'Use this exact compatible structure:',
        "module.exports = {",
        "    name: '',",
        "    alias: [],",
        "    desc: '',",
        "    category: '',",
        "    execute: async (sock, m, { text, reply, args, prefix, command }) => {",
        "    }",
        "};",
        'TASK:', task
    ].join('\n');
}

function buildRepairPrompt(task, badOutput) {
    return [
        'XADON AI SUPER MODE REPAIR',
        'Your last reply was invalid because it included explanation or non-code text.',
        'Return only raw JavaScript code. No explanation. No markdown.',
        'Output only one complete runnable command module.',
        'The first line must start with const or module.exports.',
        'ORIGINAL TASK:', task,
        'INVALID OUTPUT TO FIX:', badOutput
    ].join('\n');
}

async function requestCode(prompt) {
    return axios.get(`${API_URL}?text=${encodeURIComponent(prompt)}`, {
        headers: { Accept: 'application/json' },
        timeout: 120000,
        validateStatus: () => true
    });
}

module.exports = {
    name: 'code',
    alias: ['aicode', 'coder', 'dev'],
    desc: 'Advanced AI coder - generates runnable bot commands',
    category: 'AI',
    usage: '.code <prompt>',
    owner: false,

    execute: async (sock, m, { text, reply }) => {
        const jid = m.key.remoteJid;
        if (!text) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Usage :.code <prompt>\n❏ Example :.code make a kick command with reason`);
        }

        await sock.sendMessage(jid, { react: { text: "💻", key: m.key } });

        try {
            const superMode = isJsPrompt(text);
            const firstPrompt = superMode ? buildSuperPrompt(text) : text;

            let res = await requestCode(firstPrompt);
            let data = res.data || {};

            if (res.status !== 200) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ API request failed (${res.status})`);
            }

            if (!data?.status || !data?.response) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Failed to generate code`);
            }

            let result = typeof data.response === 'string' ? data.response : JSON.stringify(data.response, null, 2);
            result = extractPureCode(result);

            // Auto-repair if not valid command
            if (superMode && !looksLikeCommandCode(result)) {
                const retryRes = await requestCode(buildRepairPrompt(text, result));
                const retryData = retryRes.data || {};
                if (retryRes.status === 200 && retryData?.status && retryData?.response) {
                    const repaired = extractPureCode(typeof retryData.response === 'string' ? retryData.response : JSON.stringify(retryData.response, null, 2));
                    if (repaired) result = repaired;
                }
            }

            result = extractPureCode(result);

            if (superMode && !looksLikeCommandCode(result)) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ API returned non-command output`);
            }

            await sock.sendMessage(jid, { react: { text: "📤", key: m.key } });

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CODE GENERATOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *Prompt:* ${text}
│`;

            const parts = chunkText(result, 3500);
            for (let i = 0; i < parts.length; i++) {
                const isFirst = i === 0;
                const isLast = i === parts.length - 1;
                let caption = isFirst ? header : `│`;
                caption += `\n│ \`\`\`js\n${parts[i]}\n\`\`\``;
                if (isLast) caption += `\n╰─────────────────────────╯\n⚡ Powered by AI`;
                await sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[CODE ERROR]', err?.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
            reply(`✘ ֎ Error generating code\n❏ Error : ${errorMsg}`);
        }
    }
};