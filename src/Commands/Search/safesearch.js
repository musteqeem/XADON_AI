const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'safesearch', alias: [], category: 'Search', desc: 'Researched safesearch command', usage: '.safesearch [input]', 
  execute: async (sock, m, { args, reply }) => { try { const q = text(args, m); if (!q) return reply('Usage: .safesearch <query>'); const r = await fetch('https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1&safe_search=1'); const d = await r.json(); return reply(d.AbstractText || d.Answer || 'No concise result found.'); } catch (error) { console.error('[SAFESEARCH ERROR]', error); return reply('Error: ' + error.message); } }
};
