const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'tremolo',
    alias: ['tremvoice'],
    category: 'Voice',
    desc: 'Apply a tremolo modulation effect.',
    usage: '.tremolo (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'tremolo=f=7:d=0.7');
    }
};
