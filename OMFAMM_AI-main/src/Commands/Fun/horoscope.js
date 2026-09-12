module.exports = {
  name: 'horoscope', alias: [], category: 'Fun',
  desc: 'Generate a safe horoscope prompt',
  usage: '.horoscope',
  execute: async (sock, m, { reply }) => {
    const items = ["Focus on one practical goal today.", "A small consistent step beats a rushed big one.", "Ask questions before making assumptions."];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
