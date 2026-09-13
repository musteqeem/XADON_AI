module.exports = {
  name: 'meme', alias: [], category: 'Fun',
  desc: 'Generate a safe meme prompt',
  usage: '.meme',
  execute: async (sock, m, { reply }) => {
    const items = ["When the code works first try: suspicious.", "Me: one tiny fix. Also me: rewrites the whole project."];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
