const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'admins', alias: [], category: 'Group', desc: 'Researched admins command', usage: '.admins [input]', groupOnly: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const d = await sock.groupMetadata(m.chat); return reply((d.participants || []).filter(x => x.admin).map(x => x.id).join('\n') || 'No admins found.'); } catch (error) { console.error('[ADMINS ERROR]', error); return reply('Error: ' + error.message); } }
};
