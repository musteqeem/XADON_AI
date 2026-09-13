module.exports = {
    name: 'quickpoll',
    alias: ['qpoll', 'makepoll'],
    category: 'ANY IDEA',
    desc: 'Create a native WhatsApp poll quickly',
    usage: '.quickpoll Question | Option 1 | Option 2 | [Option 3...]',
    groupOnly: false,
    reactions: { start: '📊', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const parts = args.join(' ').split('|').map(value => value.trim()).filter(Boolean);
        const question = parts.shift();
        const options = [...new Set(parts)];

        if (!question || options.length < 2) {
            return reply(
                '📊 *QUICK POLL*\n\n' +
                'Usage: .quickpoll Question | Option 1 | Option 2 | Option 3\n' +
                'Example: .quickpoll Best language? | JavaScript | Python | Go'
            );
        }

        if (options.length > 12) {
            return reply('❌ WhatsApp polls should contain no more than 12 options.');
        }

        try {
            await sock.sendMessage(m.chat, {
                poll: {
                    name: question.slice(0, 255),
                    values: options.map(option => option.slice(0, 100)),
                    selectableCount: 1
                }
            }, { quoted: m });
        } catch (error) {
            console.error('[QUICKPOLL ERROR]', error);
            return reply(`❌ Could not create the poll: ${error.message}`);
        }
    }
};
