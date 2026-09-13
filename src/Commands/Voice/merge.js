const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'boost',
    alias: ['voiceboost', 'loudvoice'],
    category: 'Voice',
    desc: 'Normalize and boost a voice note.',
    usage: '.boost (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'volume=1.5,acompressor=threshold=-18dB:ratio=3');
    }
};
