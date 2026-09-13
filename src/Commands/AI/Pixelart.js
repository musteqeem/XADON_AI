const generate = require('./generate');

module.exports = {
  name: 'pixelart',
  alias: ['pixel'],
  category: 'AI',
  desc: 'Generate a pixel-art image from a prompt',
  usage: '.pixelart <prompt>',
  execute: async (sock, m, ctx) => {
    const args = Array.isArray(ctx.args) ? [...ctx.args] : [];
    if (!args.length) return ctx.reply('Usage: .pixelart <prompt>');
    ctx.args = ['pixel art, crisp pixels, limited palette, clean sprite-like edges,', ...args];
    return generate.execute(sock, m, ctx);
  }
};
