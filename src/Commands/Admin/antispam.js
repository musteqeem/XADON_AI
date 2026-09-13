const defense = require('../Defense/antispam');

module.exports = {
    ...defense,
    category: 'Admin'
};

module.exports.handleAntiSpam = defense.handleAntispam;
