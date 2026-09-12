const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'fast',
    alias: ['speedvoice'],
    category: 'Voice',
    desc: 'Speed up a voice note.',
    usage: '.fast (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'atempo=1.5,volume=1.1');
    }
};
