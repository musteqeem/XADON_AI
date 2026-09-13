module.exports = {
  name: 'truth', alias: [], category: 'Fun',
  desc: 'Generate a safe truth prompt',
  usage: '.truth',
  execute: async (sock, m, { reply }) => {
    const items = ["What project would you finish if you stopped waiting for it to be perfect?", "What skill do you want to master next?"];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
