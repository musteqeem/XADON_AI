module.exports = {
  name: 'waban', alias: ['ban'], category: 'Group', desc: 'Ban a participant from the group', usage: '.waban @user', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { reply }) => {
    try {
      const target = m.mentionedJid?.[0] || m.quoted?.sender;
      if (!target) return reply('Mention or quote the participant to ban.');
      await sock.groupParticipantsUpdate(m.chat, [target], 'remove');
      return reply('Participant removed from the group.');
    } catch (error) { console.error('[WABAN ERROR]', error); return reply('Ban failed: ' + error.message); }
  }
};
