const { fetchJson } = require('../_helpers');

module.exports = {
    name: 'factapi',
    alias: ['fact', 'randomfact'],
    category: 'ANY IDEA',
    desc: 'Fetch a random general-interest fact from a public API',
    usage: '.factapi',
    reactions: { start: '🧠', success: '✨', error: '❌' },

    execute: async (sock, m, { reply }) => {
        try {
            const data = await fetchJson('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', {}, 10000);
            const fact = data?.text;
            if (!fact) throw new Error('The API returned no fact.');
            return reply(`🧠 *RANDOM FACT*\n\n${fact}`);
        } catch (error) {
            console.error('[FACT API ERROR]', error.message);
            return reply('❌ Fact service is unavailable right now.');
        }
    }
};
