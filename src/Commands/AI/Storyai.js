const axios = require("axios");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const AI_GATEWAY = 'https://appex.crysnovax.link';
const AI_TOKEN = 'x';

// ORIGINAL GATEWAY + 3 PUBLIC STORY AIs
const STORY_APIS = [
    {
        name: 'Xadon Gemini',
        ask: async (prompt) => {
            const url = `${AI_GATEWAY}/ai/gemini?text=${encodeURIComponent(prompt)}&token=${AI_TOKEN}`;
            const res = await axios.get(url, { timeout: 60000 });
            return res.data?.result || '';
        }
    },
    {
        name: 'Xadon Claude',
        ask: async (prompt) => {
            const url = `${AI_GATEWAY}/ai/claude?text=${encodeURIComponent(prompt)}&token=${AI_TOKEN}`;
            const res = await axios.get(url, { timeout: 60000 });
            return res.data?.result || '';
        }
    },
    {
        name: 'Pollinations AI',
        ask: async (prompt) => {
            const res = await axios.post('https://text.pollinations.ai/', {
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o'
            }, { timeout: 45000 });
            return res.data || '';
        }
    },
    {
        name: 'DeepAI Chat',
        ask: async (prompt) => {
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
        name: 'Cohere Chat',
        ask: async (prompt) => {
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
    name: 'story',
    alias: ['storyteller', 'tale', 'novel'],
    category: 'AI',
    desc: `${BOT_NAME} Advanced storytelling AI with 5 API fallbacks`,
    usage: '.story <prompt> |.story creative <prompt> |.story short/long <prompt>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} STORYTELLING AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏.story <prompt>\n│ ❏.story creative <prompt>\n│ ❏.story short <prompt>\n│ ❏.story long <prompt>\n│ \n│ ❏ *Examples:*\n│ ❏.story a boy who found a dragon\n│ ❏.story creative lost in space\n╰─────────────────────────╯`);
        }

        let length = 'medium';
        let isCreative = false;
        const flags = ['creative', 'short', 'medium', 'long'];
        let textArgs = [...args];

        while (textArgs.length > 0 && flags.includes(textArgs[0].toLowerCase())) {
            const flag = textArgs.shift().toLowerCase();
            if (['short', 'medium', 'long'].includes(flag)) length = flag;
            if (flag === 'creative') isCreative = true;
        }

        const userQuery = textArgs.join(' ').trim();
        if (!userQuery) return reply('✘ ❏ Give a valid story prompt');

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: '📖', key: m.key } });
        await reply(`❏ *Writing your story...*`);

        // Build prompt based on options
        let lengthInstruction;
        if (length === 'short') lengthInstruction = 'Keep the story short, around 3-4 paragraphs.';
        else if (length === 'long') lengthInstruction = 'Write a long, detailed story with rich descriptions, 8-10 paragraphs.';
        else lengthInstruction = 'Write a story of medium length, around 5-7 paragraphs.';

        const creativityInstruction = isCreative
         ? 'Be highly creative, use vivid imagery, metaphors, and unexpected twists.'
          : 'Write an engaging and well-structured story.';

        const prompt = `You are ${BOT_NAME}, a master storyteller. ${creativityInstruction} ${lengthInstruction} Do not roleplay or break character. Just tell the story.\n\nStory prompt: ${userQuery}\n\nStory:`;

        let result = '';
        let sourceUsed = '';

        // Try all 5 APIs - GEMINI FIRST
        for (let i = 0; i < STORY_APIS.length; i++) {
            try {
                console.log(`[STORY] Trying ${STORY_APIS[i].name}`);
                result = await STORY_APIS[i].ask(prompt);
                if (result && result.trim().length > 20) {
                    sourceUsed = STORY_APIS[i].name;
                    break;
                }
            } catch (e) {
                console.log(`[STORY] ${STORY_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!result || result.length < 10) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Could not generate story\n❏ All 5 APIs failed`);
        }

        await sock.sendMessage(jid, {
            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} STORYTELLING AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Prompt:* ${userQuery}\n❏ *Length:* ${length.toUpperCase()}${isCreative? ' • Creative' : ''}\n❏ *Source:* ${sourceUsed}\n\n${result}\n\n❏ Powered by ${BOT_NAME}`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

    } catch (err) {
        console.error('[STORY ERROR]', err.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        reply('✘ ❏ Failed to generate story');
    }
}
};