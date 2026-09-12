const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'kick', alias: [], category: 'Admin', desc: 'Researched kick command', usage: '.kick [input]', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const target = m.mentionedJid?.[0] || m.quoted?.sender; if (!target) return reply('Mention or quote a participant.'); await sock.groupParticipantsUpdate(m.chat, [target], 'remove'); return reply('Participant removed.'); } catch (error) { console.error('[KICK ERROR]', error); return reply('Error: ' + error.message); } }
};
