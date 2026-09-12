const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'yt', alias: [], category: 'Media', desc: 'Researched yt command', usage: '.yt [input]', 
  execute: async (sock, m, { args, reply }) => { try { const u = args?.[0]; if (!/^https?:\/\//i.test(u || '')) return reply('Usage: .yt <YouTube URL>'); const r = await fetch('https://yt-dl.officialhectormanuel.workers.dev/?url=' + encodeURIComponent(u)); if (!r.ok) return reply('YouTube service returned HTTP ' + r.status); const d = await r.json(); return reply(JSON.stringify(d, null, 2).slice(0, 10000)); } catch (error) { console.error('[YT ERROR]', error); return reply('Error: ' + error.message); } }
};
