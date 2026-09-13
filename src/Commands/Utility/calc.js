const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'calc', alias: [], category: 'Utility', desc: 'Researched calc command', usage: '.calc [input]', 
  execute: async (sock, m, { args, reply }) => { try { const value = text(args, m); if (!/^[0-9+\-*/%().,\s]+$/.test(value)) return reply('Only arithmetic expressions are supported.'); return reply(String(Function('"use strict"; return (' + value + ')')())); } catch (error) { console.error('[CALC ERROR]', error); return reply('Error: ' + error.message); } }
};
