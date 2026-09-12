const antiDelete = require('../Tools/antidelete');

module.exports = {
    ...antiDelete,
    name: 'deletedwatch',
    alias: ['dw'],
    category: 'Defense',
    desc: 'Monitor and recover deleted messages using the anti-delete engine'
};

module.exports.handleDeletedWatch = antiDelete.handleAntiDelete;
