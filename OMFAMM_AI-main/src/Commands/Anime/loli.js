module.exports = {
    name: 'loli',
    alias: ['lolicon'],
    category: 'Anime',
    desc: 'Disabled: this command is not included in the safe command set.',
    usage: '.loli',
    execute: async (sock, m, { reply }) => {
        return reply('❌ This command is disabled in this build.');
    }
};
