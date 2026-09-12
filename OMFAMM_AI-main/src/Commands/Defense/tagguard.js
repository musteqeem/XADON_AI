const antiTag = require('./antitag');

module.exports = {
    ...antiTag,
    name: 'tagguard',
    alias: ['tg'],
    desc: 'Alias command for the anti-tag defense engine'
};

module.exports.handleTagGuard = antiTag.handleAntiTag;
