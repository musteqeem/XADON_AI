const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'uptime', alias: [], category: 'Utility', desc: 'Researched uptime command', usage: '.uptime [input]', 
  execute: async (sock, m, { args, reply }) => { try { return reply('Uptime: ' + Math.floor(process.uptime()) + ' seconds'); } catch (error) { console.error('[UPTIME ERROR]', error); return reply('Error: ' + error.message); } }
};
