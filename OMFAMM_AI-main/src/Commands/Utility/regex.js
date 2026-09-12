const { inputText } = require('../_helpers');
module.exports = {
  name: 'regex', alias: ['regexp'], category: 'Utility',
  desc: 'Test a regular expression against text', usage: '.regex <pattern> [flags] | <text>',
  execute: async (sock, m, { args, reply }) => {
    const a = Array.isArray(args) ? args : [];
    if (!a.length) return reply('Usage: .regex <pattern> [flags] | <text>');
    const separator = a.indexOf('|');
    let pattern, flags = '', sample;
    if (separator > 0) {
      pattern = a.slice(0, separator).join(' ');
      sample = a.slice(separator + 1).join(' ');
    } else {
      pattern = a[0]; flags = a[1] || ''; sample = a.slice(2).join(' ');
    }
    try {
      const re = new RegExp(pattern, flags);
      return reply(`Match: ${re.test(sample) ? 'YES' : 'NO'}\nPattern: /${pattern}/${flags}\nText: ${sample}`);
    } catch (e) { return reply(`Invalid regex: ${e.message}`); }
  }
};
