/**
 * ╔══════════════════════════════════════╗
 * ║   .repo — XADON AI Creator Panel     ║
 * ║   Powered by MUSTEQEEM MD            ║
 * ╚══════════════════════════════════════╝
 */

module.exports = {
    name: 'repo',
    alias: ['github', 'source', 'xadon'],
    desc: 'Show XADON AI creator panel & repositories',
    category: 'Info',
    reactions: { start: '⚡', success: '✨' },
    
    execute: async (sock, m, { reply }) => {
        const REPO_IMG = 'https://files.catbox.moe/bkvkel.jpeg'; // XADON AI thumbnail

        const caption = 
`╭─❏ *MUSTEQEEM MD* ❏─╮
│
│ ⚡ *270+ Commands Active*
│ 🚀 *Zero Lag* | *ARM64 Fast*
│ 🛡️ *Cybershield Squad alive*
│
├─❏ *WHAT YOU GET* ❏─
│ 🤖 *AI:* GPT-5, Gemini, Copilot
│ 🎬 *DL:* YT, TT, IG, FB, APK
│ 🎨 *GEN:* Images, Code, TTS
│ 🛡️ *GUARD:* Anti-Link, Anti-Delete
│ 🎵 *AUDIO:* Bass, 8D, Nightcore
│
├─❏ *QUICK START* ❏─
│ • .xadon <question> → Ask AI
│ • .play <song> → MP3 Download  
│ • .genimg <prompt> → AI Art
│ • .menu <category> → Browse all
│
├─❏ *JOIN THE MISSION* ❏─
│ 🧪 *Test New Features:*
│ 1. chat.whatsapp.com/Ebd5NAkaJIDGb4GFNR23xs 
│ 2. chat.whatsapp.com/CpPyihSkYpd6LEioa5ffaT
│ 📢 *Update Channel:*
│ whatsapp.com/channel/0029Vb7ACifD38Cb7Jlj5w3B
│
├─❏ *TELEGRAM LINKS* ❏─
│ 📢 *Channel:* https://t.me/xadontech
│ 👥 *Group:* https://t.me/xadongc  
│ 👑 *Admin:* https://t.me/xadonite
│ 📺 *Tutorial:* https://youtu.be/qDf3ma6WGmM
│
├─❏ *NPM PACKAGE* ❏─
│ 📦 https://www.npmjs.com/package/@musteqeem/baileys
│
├─❏ *GITHUB REPOS* ❏─
│ 🌟 Don't Forget to ✨Star🌟 our repo
│ ╠═══⟪ *🌟JOIN DEV LAB⭐* ⟫═══╣
│ ║ 🧪 https://github.com/CEOcybershieldquad/XADON-AI
│ ║ 🔗 https://github.com/musteqeem/baileys
│ ║ 🌐 https://xadon.vercel.app
│ ╚═══⟪ *By MUSTEQEEM MD* ⟫═══╝
│
╰─❏ *By MUSTEQEEM MD • For All* ❏─╯

You are ultimately welcomed 👑🤗
` + `\n_© XADON AI V2 | ${new Date().toLocaleDateString('en-US', {timeZone: 'Africa/Lagos'})}_`;

        try {
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: REPO_IMG },
                caption
            }, { quoted: m });
        } catch (e) {
            console.log('[Repo command error]', e.message);
            await reply(caption);
        }
    }
};