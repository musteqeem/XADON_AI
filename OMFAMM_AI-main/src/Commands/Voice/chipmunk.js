const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'chipmunk',
    alias: ['chipmunkvoice'],
    category: 'Voice',
    desc: 'Raise the pitch for a chipmunk-style voice.',
    usage: '.chipmunk (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'asetrate=44100*1.15,atempo=0.87,aresample=44100');
    }
};
