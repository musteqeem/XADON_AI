const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'hidetag', alias: [], category: 'Group', desc: 'Researched hidetag command', usage: '.hidetag [input]', groupOnly: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const d = await sock.groupMetadata(m.chat); const mentions = (d.participants || []).map(x => x.id); return sock.sendMessage(m.chat, { text: text(args, m) || 'Hidden group notice', mentions }, { quoted: m }); } catch (error) { console.error('[HIDETAG ERROR]', error); return reply('Error: ' + error.message); } }
};
