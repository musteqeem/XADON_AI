const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'distort',
    alias: ['crushvoice'],
    category: 'Voice',
    desc: 'Add a controlled digital distortion effect.',
    usage: '.distort (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'acrusher=bits=4:mix=0.8,volume=1.4');
    }
};
