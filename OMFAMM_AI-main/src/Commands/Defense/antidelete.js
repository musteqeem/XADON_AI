const antiDelete = require('../Tools/antidelete');

module.exports = {
    ...antiDelete,
    name: 'antidelete',
    alias: ['ad'],
    category: 'Defense',
    desc: 'Recover deleted messages from the local message cache'
};

module.exports.handleAntiDelete = antiDelete.handleAntiDelete;
