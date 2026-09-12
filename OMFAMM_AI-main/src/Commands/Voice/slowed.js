const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'slow',
    alias: ['slowvoice', 'slowed'],
    category: 'Voice',
    desc: 'Slow down a voice note.',
    usage: '.slow (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'atempo=0.67,volume=1.1');
    }
};
