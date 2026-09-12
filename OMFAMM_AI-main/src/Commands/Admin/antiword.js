const defense = require('../Defense/antiword');

module.exports = {
    ...defense,
    category: 'Admin'
};

module.exports.handleAntiWord = defense.handleAntiWord;
