const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'define', alias: [], category: 'Utility', desc: 'Researched define command', usage: '.define [input]', 
  execute: async (sock, m, { args, reply }) => { try { const q = text(args, m); if (!q) return reply('Usage: .define <word>'); const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(q)); if (!r.ok) return reply('No dictionary entry found.'); const d = await r.json(); return reply(d[0]?.meanings?.slice(0, 2).map(x => x.partOfSpeech + ': ' + x.definitions?.[0]?.definition).join('\n') || 'No definition found.'); } catch (error) { console.error('[DEFINE ERROR]', error); return reply('Error: ' + error.message); } }
};
