module.exports = {
  name: 'wouldyourather', alias: [], category: 'Fun',
  desc: 'Generate a safe wouldyourather prompt',
  usage: '.wouldyourather',
  execute: async (sock, m, { reply }) => {
    const items = ["Would you rather have perfect documentation or perfect tests?", "Would you rather debug one huge bug or ten tiny ones?"];
    return reply(items[Math.floor(Math.random() * items.length)]);
  }
};
