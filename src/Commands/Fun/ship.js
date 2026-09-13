module.exports = {
  name: 'ship', alias: [], category: 'Fun',
  desc: 'Generate a safe ship prompt',
  usage: '.ship',
  execute: async (sock, m, { reply }) => {
    const items = ["Compatibility is a mystery; communication is the real metric."];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
