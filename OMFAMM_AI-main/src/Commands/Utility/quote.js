const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'quote', alias: [], category: 'Utility', desc: 'Researched quote command', usage: '.quote [input]', 
  execute: async (sock, m, { args, reply }) => { try { const r = await fetch('https://api.quotable.io/random'); if (!r.ok) return reply('Quote service unavailable.'); const d = await r.json(); return reply('“' + d.content + '”\n— ' + d.author); } catch (error) { console.error('[QUOTE ERROR]', error); return reply('Error: ' + error.message); } }
};
