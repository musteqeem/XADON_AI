module.exports = {
  name: 'unmute',
  alias: ['um'],
  description: 'Unmute a group',
  category: 'group',
  execute: async (sock, m, { args, reply }) => {
    try {
      if (!m.isGroup) return reply('_*This command can only be used in a group!*_');

      await sock.groupSettingUpdate(m.chat, 'not_announcement');
      const response = '*Group has been unmuted!*';
      reply(response);
    } catch (error) {
      console.error('Error unmuting group:', error);
      reply(`Error unmuting group: ${error.message}`);
    }
  }
};