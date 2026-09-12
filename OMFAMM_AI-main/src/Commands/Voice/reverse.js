const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'reverse',
    alias: ['revvoice'],
    category: 'Voice',
    desc: 'Reverse the audio.',
    usage: '.reverse (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'areverse');
    }
};
