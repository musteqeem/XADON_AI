module.exports = {
  name: 'roast', alias: [], category: 'Fun',
  desc: 'Generate a safe roast prompt',
  usage: '.roast',
  execute: async (sock, m, { reply }) => {
    const items = ["Your bug report said 'works on my machine' and stopped there.", "That code has confidence, but not enough tests."];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
