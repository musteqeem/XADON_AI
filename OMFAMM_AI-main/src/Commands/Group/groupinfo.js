const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'groupinfo', alias: [], category: 'Group', desc: 'Researched groupinfo command', usage: '.groupinfo [input]', groupOnly: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const d = await sock.groupMetadata(m.chat); return reply(JSON.stringify({ id: d.id, subject: d.subject, owner: d.owner, members: d.participants?.length || 0, admins: d.participants?.filter(x => x.admin).length || 0 }, null, 2)); } catch (error) { console.error('[GROUPINFO ERROR]', error); return reply('Error: ' + error.message); } }
};
