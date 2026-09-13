module.exports = {
  name: 'dare', alias: [], category: 'Fun',
  desc: 'Generate a safe dare prompt',
  usage: '.dare',
  execute: async (sock, m, { reply }) => {
    const items = ["Describe your next goal in one sentence.", "Send a genuine thank-you to someone.", "Learn one new shortcut today."];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
