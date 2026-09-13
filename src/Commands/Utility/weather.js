const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'weather', alias: [], category: 'Utility', desc: 'Researched weather command', usage: '.weather [input]', 
  execute: async (sock, m, { args, reply }) => { try { const q = text(args, m); if (!q) return reply('Usage: .weather <city>'); const r = await fetch('https://wttr.in/' + encodeURIComponent(q) + '?format=j1'); if (!r.ok) return reply('Weather service returned HTTP ' + r.status); const d = await r.json(); const c = d.current_condition?.[0]; return reply(JSON.stringify({ area: d.nearest_area?.[0]?.areaName?.[0]?.value, temperature: c?.temp_C + ' C', condition: c?.weatherDesc?.[0]?.value, humidity: c?.humidity + '%' }, null, 2)); } catch (error) { console.error('[WEATHER ERROR]', error); return reply('Error: ' + error.message); } }
};
