const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'reverb',
    alias: ['reverbvoice'],
    category: 'Voice',
    desc: 'Add a spacious reverb effect.',
    usage: '.reverb (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'aecho=0.8:0.9:1000:0.5,volume=1.2');
    }
};
