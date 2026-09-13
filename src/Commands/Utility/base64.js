const { inputText } = require('../_helpers');
module.exports = {
  name: 'base64', alias: ['b64'], category: 'Utility',
  desc: 'Encode UTF-8 text as Base64', usage: '.base64 <text>',
  execute: async (sock, m, { args, reply }) => {
    const input = inputText(args, m);
    if (!input) return reply('Usage: .base64 <text>');
    return reply(Buffer.from(input, 'utf8').toString('base64'));
  }
};
