const antiWord = require('./antiword');

module.exports = {
    ...antiWord,
    name: 'wordguard',
    alias: ['wg'],
    desc: 'Alias command for the anti-word defense engine'
};

module.exports.handleWordGuard = antiWord.handleAntiWord;
