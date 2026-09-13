const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'setdesc', alias: [], category: 'Admin', desc: 'Researched setdesc command', usage: '.setdesc [input]', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const value = text(args, m); if (!value) return reply('Usage: .setdesc <description>'); await sock.groupUpdateDescription(m.chat, value); return reply('Group description updated.'); } catch (error) { console.error('[SETDESC ERROR]', error); return reply('Error: ' + error.message); } }
};
