const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'tagall', alias: [], category: 'Group', desc: 'Researched tagall command', usage: '.tagall [input]', groupOnly: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const d = await sock.groupMetadata(m.chat); const mentions = (d.participants || []).map(x => x.id); return sock.sendMessage(m.chat, { text: text(args, m) || 'Attention everyone', mentions }, { quoted: m }); } catch (error) { console.error('[TAGALL ERROR]', error); return reply('Error: ' + error.message); } }
};
