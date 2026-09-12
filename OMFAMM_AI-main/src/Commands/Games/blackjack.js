module.exports = {
  name: 'blackjack', alias: [], category: 'Games', desc: 'Deal a blackjack hand', usage: '.blackjack',
  execute: async (sock, m, { reply }) => { try { const card = () => Math.floor(Math.random() * 10) + 1; const hand = [card(), card()]; return reply('Your hand: ' + hand.join(', ') + ' (total ' + hand.reduce((a, b) => a + b, 0) + ')'); } catch (error) { return reply('Game error: ' + error.message); } }
};
