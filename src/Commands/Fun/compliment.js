module.exports = {
  name: 'compliment', alias: [], category: 'Fun',
  desc: 'Generate a safe compliment prompt',
  usage: '.compliment',
  execute: async (sock, m, { reply }) => {
    const items = ["Your curiosity is a strength.", "You keep improving by asking good questions.", "Your creativity can turn simple ideas into useful projects."];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
