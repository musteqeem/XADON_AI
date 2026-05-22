module.exports = {
  name: 'adddesc',
  alias: ['appenddesc'],
  description: 'Add t֎ group description without removing existing one',
  category: 'Group',
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,

  execute: async (sock, m, { args, reply }) => {

    const newText = args.join(' ');
    if (!newText)
      return reply('Provide text t֎ add!\nExample: .adddesc Welcome t֎ the gr֎up');

    try {
      // Get current group description
      const metadata = await sock.groupMetadata(m.chat);
      const currentDesc = metadata.desc || '';

      // Append new text
      const updatedDesc = currentDesc
        ? `${currentDesc}\n\n${newText}`
        : newText;

      // Update description
      await sock.groupUpdateDescription(m.chat, updatedDesc);

      await reply(`Successfully added t֎ description\nAdded:\n${newText}`);

    } catch (error) {
      console.error('[ADDDESC ERROR]', error);
      await reply(`Failed t֎ update description\n${error.message}`);
    }
  }
};