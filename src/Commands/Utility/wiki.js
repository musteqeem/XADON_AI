const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'wiki', alias: [], category: 'Utility', desc: 'Researched wiki command', usage: '.wiki [input]', 
  execute: async (sock, m, { args, reply }) => { try { const q = text(args, m); if (!q) return reply('Usage: .wiki <topic>'); const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q)); if (!r.ok) return reply('Wikipedia returned HTTP ' + r.status); const d = await r.json(); return reply((d.title || q) + '\n\n' + (d.extract || 'No summary found.') + (d.content_urls?.desktop?.page ? '\n' + d.content_urls.desktop.page : '')); } catch (error) { console.error('[WIKI ERROR]', error); return reply('Error: ' + error.message); } }
};
