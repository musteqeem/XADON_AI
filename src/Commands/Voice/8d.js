const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: '8d',
    alias: ['8dvoice'],
    category: 'Voice',
    desc: 'Create an 8D-style moving stereo effect.',
    usage: '.8d (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'apulsator=hz=0.19:amount=0.8');
    }
};
