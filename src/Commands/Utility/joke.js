const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'joke', alias: [], category: 'Utility', desc: 'Researched joke command', usage: '.joke [input]', 
  execute: async (sock, m, { args, reply }) => { try { const r = await fetch('https://official-joke-api.appspot.com/random_joke'); if (!r.ok) return reply('Joke service unavailable.'); const d = await r.json(); return reply(d.setup + '\n' + d.punchline); } catch (error) { console.error('[JOKE ERROR]', error); return reply('Error: ' + error.message); } }
};
