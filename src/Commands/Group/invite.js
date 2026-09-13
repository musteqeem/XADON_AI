const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'invite', alias: [], category: 'Group', desc: 'Researched invite command', usage: '.invite [input]', groupOnly: true,
  execute: async (sock, m, { args, reply }) => { try { if (!m.isGroup) return reply('GROUP ONLY'); const code = await sock.groupInviteCode(m.chat); return reply('https://chat.whatsapp.com/' + code); } catch (error) { console.error('[INVITE ERROR]', error); return reply('Error: ' + error.message); } }
};
