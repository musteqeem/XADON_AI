const defense = require('../Defense/antitag');

module.exports = {
    ...defense,
    category: 'Admin'
};

module.exports.handleAntiTag = defense.handleAntitag;
