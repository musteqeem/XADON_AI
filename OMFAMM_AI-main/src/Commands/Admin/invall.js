module.exports = {
  name: 'invtag',
  alias: ['ghost', 'invisitag'],
  description: 'Tag everyone in the group invisibly',
  category: 'Group',

  execute: async (sock, m, { reply }) => {
    const isGroup = m.chat.endsWith('@g.us');
    if (!isGroup) return reply('This command can only be used in groups');

    const metadata = await sock.groupMetadata(m.chat);
    const participants = metadata.participants.map(p => p.id);

    // Premium reactions
    for (const emoji of ['👻','📢','⚡','✨','✅']) {
      await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    }

    // Invisible tag message
    await sock.sendMessage(m.chat, {
      text: ' ', // invisible char
      contextInfo: { mentionedJid: participants }
    });
  }
};
