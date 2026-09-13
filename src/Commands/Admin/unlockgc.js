const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'unlockgc', alias: [], category: 'Admin', desc: 'Researched unlockgc command', usage: '.unlockgc [input]', groupOnly: true, adminOnly: true, botAdmin: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); await sock.groupSettingUpdate(m.chat, 'not_announcement'); return reply('Group unlocked for members.'); } catch (error) { console.error('[UNLOCKGC ERROR]', error); return reply('Error: ' + error.message); } }
};
