const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = [{
    name: 'allfonts',
    alias: ['allfont', 'styletext', 'fancy'],
    category: 'Converter',
    desc: 'Generate fancy text styles',
    usage: '.allfonts <text>',
    reactions: { start: '✧', success: '✨' },
    
    execute: async (sock, m, { args, reply, prefix }) => {
        const text = args.join(' ').trim();
        if (!text) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FONTS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FONT GENERATOR*
│ ❏ Command : ${prefix}allfonts <text>
│ ❏ Example : ${prefix}allfonts Hello World
│ ❏ Limit : Shows top 20 styles
│ ❏ More : ${prefix}fontlist | ${prefix}randomfont
│ ❏ Support : Contact 2347079056039
╰─────────────────────────╯`;
            return reply(help);
        }
        
        try {
            await sock.sendMessage(m.chat, { 
                react: { text: '✧', key: m.key } 
            });
            
            const res = await axios.get(`https://apis.prexzyvilla.site/tools/allstyles?text=${encodeURIComponent(text)}`);
            const styles = res.data?.data || res.data?.results || res.data || {};
            
            if (!styles || Object.keys(styles).length === 0) {
                return reply(`✘ ֎ Error: No styles generated`);
            }
            
            let output = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} TEXT STYLES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RESULT FOR: ${text}*
`;
            
            Object.entries(styles).slice(0, 20).forEach(([name, styled]) => {
                output += `│ ❏ *${name}* : ${styled}\n`;
            });
            
            output += `│
│ ❏ Bot : ${BOT_NAME}
│ ❏ More styles : ${prefix}fontlist
╰─────────────────────────╯`;
            
            await sock.sendMessage(m.chat, { text: output }, { quoted: m });
            await sock.sendMessage(m.chat, { 
                react: { text: '✨', key: m.key } 
            });
            
        } catch (err) {
            console.error('[ALLFONTS]', err.message);
            reply(`✘ ֎ Error: Failed to generate styles. Try again later`);
        }
    }
},
// NEW SUBCOMMAND 1
{
    name: 'fontlist',
    alias: ['fonts'],
    category: 'Converter',
    desc: 'Show available font categories',
    usage: '.fontlist',
    execute: async (sock, m, { prefix, reply }) => {
        let list = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} FONTLIST •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *AVAILABLE FONTS*
│ ❏ Bold | Italic | Cursive
│ ❏ Bubble | Square | Outline
│ ❏ Gothic | Fraktur | Script
│ ❏ Use: ${prefix}allfonts <text>
╰─────────────────────────╯`;
        reply(list);
    }
},
// NEW SUBCOMMAND 2  
{
    name: 'randomfont',
    alias: ['rf'],
    category: 'Converter',
    desc: 'Generate 1 random fancy style',
    usage: '.randomfont <text>',
    execute: async (sock, m, { args, prefix, reply }) => {
        const text = args.join(' ').trim();
        if (!text) return reply(`✘ ֎ Usage: ${prefix}randomfont <text>`);
        
        try {
            const res = await axios.get(`https://apis.prexzyvilla.site/tools/allstyles?text=${encodeURIComponent(text)}`);
            const styles = res.data?.data || res.data?.results || res.data || {};
            const keys = Object.keys(styles);
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            
            let out = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} RANDOM FONT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RANDOM PICK*
│ ❏ Style : ${randomKey}
│ ❏ Result : ${styles[randomKey]}
╰─────────────────────────╯`;
            reply(out);
        } catch {
            reply(`✘ ֎ Error fetching random font`);
        }
    }
}];