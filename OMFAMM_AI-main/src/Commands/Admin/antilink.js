const defense = require('../Defense/antilink');

module.exports = {
    ...defense,
    category: 'Admin'
};

module.exports.handleAntiLink = defense.handleAntiLink;
