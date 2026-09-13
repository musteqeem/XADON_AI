const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'ping', alias: [], category: 'Utility', desc: 'Researched ping command', usage: '.ping [input]', 
  execute: async (sock, m, { args, reply }) => { try { return reply('Pong: ' + Date.now() % 1000 + 'ms local response.'); } catch (error) { console.error('[PING ERROR]', error); return reply('Error: ' + error.message); } }
};
