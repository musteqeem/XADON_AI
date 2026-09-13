module.exports = {
    name: 'x',
    alias: ['timestamp'],
    category: 'Search',
    desc: 'Show the current Unix timestamp.',
    usage: '.x',

    execute: async (sock, m, { reply }) => {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            return reply(`🕒 Unix timestamp: ${timestamp}`);
        } catch (error) {
            console.error('[X ERROR]', error);
            return reply(`❌ ${error.message}`);
        }
    }
};
