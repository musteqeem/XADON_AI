const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'drunk',
    alias: ['drunkvoice'],
    category: 'Voice',
    desc: 'Create a wobbly, slowed-down voice effect.',
    usage: '.drunk (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'asetrate=44100*0.9,atempo=1.11,aresample=44100,volume=1.2');
    }
};
