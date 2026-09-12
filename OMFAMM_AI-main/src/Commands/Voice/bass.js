const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'bass',
    alias: ['bassvoice'],
    category: 'Voice',
    desc: 'Boost the low frequencies for a bass-heavy voice.',
    usage: '.bass (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'bass=g=12,acompressor=threshold=-25dB:ratio=3,volume=1.1');
    }
};
