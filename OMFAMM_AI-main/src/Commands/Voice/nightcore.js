const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'nightcore',
    alias: ['night'],
    category: 'Voice',
    desc: 'Create a bright, higher-pitched nightcore effect.',
    usage: '.nightcore (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'asetrate=48000*1.25,atempo=0.8,aresample=48000');
    }
};
