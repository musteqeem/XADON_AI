module.exports = {
  command: 'mute',
  alias: ['silent'],
  description: 'Mute a group',
  category: 'group',
  groupOnly: true,
  execute: async (sock, m, { reply }) => {
    try {
      await sock.groupSettingUpdate(m.chat, 'announcement');
      await reply('_*Group muted successfully*_');
    } catch (error) {
      await reply('❌ Failed to mute group');
    }
  }
};