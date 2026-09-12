const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'translate', alias: [], category: 'Utility', desc: 'Researched translate command', usage: '.translate [input]', 
  execute: async (sock, m, { args, reply }) => { try { const [lang, ...rest] = args || []; const q = rest.join(' '); if (!lang || !q) return reply('Usage: .translate <language> <text>'); const r = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(q) + '&langpair=auto|' + encodeURIComponent(lang)); const d = await r.json(); return reply(d.responseData?.translatedText || 'Translation unavailable.'); } catch (error) { console.error('[TRANSLATE ERROR]', error); return reply('Error: ' + error.message); } }
};
