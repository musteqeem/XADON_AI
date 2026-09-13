const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'autodl', alias: [], category: 'Media', desc: 'Researched autodl command', usage: '.autodl [input]', 
  execute: async (sock, m, { args, reply }) => { try { const u = args?.[0]; if (!/^https?:\/\//i.test(u || '')) return reply('Usage: .autodl <public URL>'); const r = await fetch('https://yt-dl.officialhectormanuel.workers.dev/?url=' + encodeURIComponent(u)); if (!r.ok) return reply('Downloader returned HTTP ' + r.status); const d = await r.json(); const media = d.url || d.download || d.result?.url; if (!media) return reply(JSON.stringify(d).slice(0, 5000)); return sock.sendMessage(m.chat, { document: { url: media }, fileName: 'download', caption: d.title || 'Downloaded media' }, { quoted: m }); } catch (error) { console.error('[AUTODL ERROR]', error); return reply('Error: ' + error.message); } }
};
