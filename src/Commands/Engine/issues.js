module.exports = {
    name: 'issues',
    alias: ['compare', 'benchmark'],
    desc: 'Display comparison table of runtimes and issues',
    category: 'Info',
    usage: '.issues',
    reactions: { start: '📊', success: '✨', error: '❔' },

    execute: async (sock, m, { reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '📊', key: m.key } });

        try {
            await sock.sendMessage(m.chat, {
                headerText: `## ◈ XADON AI Runtime & Issue Comparison`,
                contentText: '---',
                title: '◈ Performance & Issues Matrix',
                table: [
                    ['Runtime', 'Speed', 'Memory', 'NPM Compat', 'Security'],
                    ['Bun', 'Very Fast', 'Low', '✅ Full', '⭐'],
                    ['Cold Start', 'Fast', 'Low', 'Edge Native', '⭐⭐'],
                    ['Node.js', 'Medium', 'Medium', 'Medium', 'Medium'],
                    ['Deno', 'Fast', 'Low', '⚠️ Partial', '⭐⭐⭐⭐⭐'],
                    ['TypeScript', 'Fast', 'Low', 'Low', 'Low'],
                    ['Deployment', 'VPS', 'VPS', 'VPS/Edge', 'VPS'],
                    ['Best For', 'Speed', 'Node.js', 'Security', 'Serverless']
                ],
                footerText: '💡 Bun is fastest for startups • Node.js has best ecosystem'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[ISSUES ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   • RUNTIME COMPARISON •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *QUICK GUIDE*
│ ❏ ⚡ Bun : Fastest, low memory
│ ❏ 🐢 Node.js : Best ecosystem
│ ❏ 🦕 Deno : Secure by default
│ ❏ 🌐 Edge : Serverless native
╰─────────────────────────╯`
            );
        }
    }
};