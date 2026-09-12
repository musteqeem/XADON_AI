const text = (args, m) => (args || []).join(' ').trim() || m?.quoted?.text || '';
const send = (sock, m, value) => sock.sendMessage(m.chat, { text: String(value).slice(0, 12000) }, { quoted: m });
module.exports = {
  name: 'githubinfo', alias: [], category: 'Search', desc: 'Researched githubinfo command', usage: '.githubinfo [input]', 
  execute: async (sock, m, { args, reply }) => { try { const q = text(args, m); if (!q) return reply('Usage: .githubinfo <owner/repo>'); const r = await fetch('https://api.github.com/repos/' + q); if (!r.ok) return reply('Repository not found.'); const d = await r.json(); return reply(JSON.stringify({ name: d.full_name, stars: d.stargazers_count, forks: d.forks_count, language: d.language, description: d.description, url: d.html_url }, null, 2)); } catch (error) { console.error('[GITHUBINFO ERROR]', error); return reply('Error: ' + error.message); } }
};
