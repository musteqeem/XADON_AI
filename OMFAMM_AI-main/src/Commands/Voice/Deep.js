const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'deep',
    alias: ['deepvoice'],
    category: 'Voice',
    desc: 'Lower the pitch for a deep voice effect.',
    usage: '.deep (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'asetrate=44100*0.75,atempo=1.333,aresample=44100');
    }
};
