module.exports = {
  name: 'waunban', alias: ['unban'], category: 'Group', desc: 'Clear a participant ban record when supported by the group workflow', usage: '.waunban <jid>', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { args, reply }) => {
    try {
      const target = m.mentionedJid?.[0] || m.quoted?.sender || args?.[0];
      if (!target) return reply('Mention, quote, or provide the participant JID.');
      const jid = target.includes('@') ? target : target + '@s.whatsapp.net';
      const result = await sock.groupParticipantsUpdate(m.chat, [jid], 'add');
      const status = String(result?.[0]?.status || '');
      if (['200', '409'].includes(status)) return reply('Participant is no longer blocked by the bot workflow.');
      return reply('Unban request returned status ' + (status || 'unknown') + '. WhatsApp does not expose a universal ban-list API.');
    } catch (error) { console.error('[WAUNBAN ERROR]', error); return reply('Unban failed: ' + error.message); }
  }
};
