const axios = require('axios');

module.exports = [{
    name: 'html2img',
    alias: ['h2i', 'htmltoimg', 'htmlimage'],
    category: 'Converter',
    desc: 'Convert HTML code to an image',
    usage: '.html2img <html code>',
    reactions: { start: '֎', success: '✨' },
    
    execute: async (sock, m, { args, reply, prefix }) => {
        const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
        const html = args.join(' ').trim();
        if (!html) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} HTML TO IMAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HTML2IMAGE CONVERTER*
│ ❏ Usage : ${prefix}html2img <html code>
│ ❏ Example : ${prefix}html2img <h1>Hello</h1>
│ ❏ Note : Keep code under 5000 chars
╰─────────────────────────╯`;
            return reply(help);
        }
        
        if (html.length > 5000) {
            return reply('✘ ֎ HTML code too long. Max 5000 characters');
        }
        
        try {
            await sock.sendMessage(m.chat, { 
                react: { text: '֎', key: m.key } 
            });
            await reply('֎ Converting HTML to image...');
            
            const res = await axios.get(`https://apis.prexzyvilla.site/tools/html2img?html=${encodeURIComponent(html)}`, {
                responseType: 'arraybuffer',
                timeout: 15000
            });
            
            const buffer = Buffer.from(res.data);
            const sizeKB = (buffer.length / 1024).toFixed(1);
            
            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CONVERSION •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HTML TO IMAGE*
│ ❏ Status : Success
│ ❏ Size : ${sizeKB} KB
│ ❏ Format : PNG
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;
            
            await sock.sendMessage(m.chat, {
                image: buffer,
                caption: caption
            }, { quoted: m });
            
            await sock.sendMessage(m.chat, { 
                react: { text: '✨', key: m.key } 
            });
            
        } catch (err) {
            console.error('[HTML2IMG]', err.message);
            reply(`✘ ֎ HTML to Image conversion failed\n❏ Error: ${err.response?.status || err.message}`);
        }
    }
}];