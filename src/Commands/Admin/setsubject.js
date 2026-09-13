const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'setsubject', alias: [], category: 'Admin', desc: 'Researched setsubject command', usage: '.setsubject [input]', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const value = text(args, m); if (!value) return reply('Usage: .setsubject <name>'); await sock.groupUpdateSubject(m.chat, value); return reply('Group subject updated.'); } catch (error) { console.error('[SETSUBJECT ERROR]', error); return reply('Error: ' + error.message); } }
};
