const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'echo',
    alias: ['echov'],
    category: 'Voice',
    desc: 'Add a clean echo effect to a voice note.',
    usage: '.echo (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, 'aecho=0.8:0.88:60:0.4');
    }
};
