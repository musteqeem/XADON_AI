module.exports = {
    name: 'nodax',
    alias: ['noda', 'nchat'],
    category: 'AI',
    desc: 'Bounded AI assistant for chat, website summaries, and command design',
    usage: '.nodax <question> | .nodax site <url> | .nodax command <description>',
    reactions: { start: '🤖', success: '✅', error: '❌' },
    execute: async (sock, m, { args, reply, isOwner }) => {
        try {
            const mode = args?.[0]?.toLowerCase();
            if (mode === 'site') {
                const url = args[1];
                if (!/^https?:\/\//i.test(url || '')) return reply('Usage: .nodax site <https URL>');
                const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
                if (!response.ok) return reply('Website returned HTTP ' + response.status);
                const html = (await response.text()).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 12000);
                return reply('Website text preview:\n' + html);
            }
            if (mode === 'command') {
                if (!isOwner) return reply('OWNER ONLY');
                const description = args.slice(1).join(' ');
                if (!description) return reply('Usage: .nodax command <safe command description>');
                return reply('Command specification:\nname: choose-a-short-name\ncategory: Utility\nusage: .choose-a-short-name <input>\nexecute: validate input, perform one bounded action, catch errors, and reply.\nRequest: ' + description);
            }
            const question = args.join(' ');
            if (!question) return reply('Usage: .nodax <question>');
            const key = process.env.GROQ_API_KEY;
            if (!key) return reply('Nodax needs GROQ_API_KEY for AI chat. Website preview and command specification remain available.');
            const response = await fetch(process.env.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ model: process.env.AI_MODEL || 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: 'You are Nodax, a helpful bounded WhatsApp assistant. Never claim unlimited power. Do not execute arbitrary code or unauthorized external actions.' }, { role: 'user', content: question }], temperature: 0.4 }) });
            if (!response.ok) return reply('Nodax API returned HTTP ' + response.status);
            const data = await response.json();
            return reply(data?.choices?.[0]?.message?.content || 'Nodax returned no response.');
        } catch (error) {
            console.error('[NODAX ERROR]', error);
            return reply('Nodax error: ' + error.message);
        }
    }
};
