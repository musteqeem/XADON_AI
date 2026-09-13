const { inputText } = require('../_helpers');
module.exports = {
  name: 'unbase64', alias: ['b64decode'], category: 'Utility',
  desc: 'Decode Base64 into UTF-8 text', usage: '.unbase64 <base64>',
  execute: async (sock, m, { args, reply }) => {
    const input = inputText(args, m).replace(/\s+/g, '');
    if (!input) return reply('Usage: .unbase64 <base64>');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(input) || input.length % 4 === 1) return reply('Invalid Base64 input.');
    try { return reply(Buffer.from(input, 'base64').toString('utf8')); }
    catch (e) { return reply(`Decode failed: ${e.message}`); }
  }
};
