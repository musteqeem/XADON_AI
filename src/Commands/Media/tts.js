const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'tts', alias: [], category: 'Media', desc: 'Researched tts command', usage: '.tts [input]', 
  execute: async (sock, m, { args, reply }) => { try { const q = text(args, m); if (!q) return reply('Usage: .tts <text>'); return sock.sendMessage(m.chat, { audio: { url: 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(q) }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m }); } catch (error) { console.error('[TTS ERROR]', error); return reply('Error: ' + error.message); } }
};
