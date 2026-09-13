const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'members', alias: [], category: 'Group', desc: 'Researched members command', usage: '.members [input]', groupOnly: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const d = await sock.groupMetadata(m.chat); return reply((d.participants || []).map((x, i) => (i + 1) + '. ' + x.id).join('\n')); } catch (error) { console.error('[MEMBERS ERROR]', error); return reply('Error: ' + error.message); } }
};
