const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'lockgc', alias: [], category: 'Admin', desc: 'Researched lockgc command', usage: '.lockgc [input]', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); await sock.groupSettingUpdate(m.chat, 'announcement'); return reply('Group locked to admins.'); } catch (error) { console.error('[LOCKGC ERROR]', error); return reply('Error: ' + error.message); } }
};
