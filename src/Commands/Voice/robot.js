const { convertAudio } = require('../Core/¿.js');

module.exports = {
    name: 'robot',
    alias: ['robotvoice'],
    category: 'Voice',
    desc: 'Create a robotic voice effect.',
    usage: '.robot (reply to an audio or voice note)',
    reactions: { start: '🎧', success: '✨', error: '❌' },

    execute: async (sock, m) => {
        return convertAudio(sock, m, "afftfilt=real='hypot(re,im)':imag=0,acompressor=threshold=-20dB:ratio=4:attack=5:release=50,volume=1.3");
    }
};
