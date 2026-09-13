const axios = require('axios');
const FormData = require('form-data');
const config = require('../../../settings/config');

const CDN_URL = process.env.CDN_URL || config.api?.cdn || '';

module.exports = {
    name: 'raw',
    alias: ['paste', 'textcdn', 'bin'],
    category: 'Tools',
    desc: 'Upload raw text/code to CRYSNOVA CDN and get a raw link',
    usage: '.raw <text or reply to text/code>',

    execute: async (sock, m, { reply, text, quoted }) => {
        let content = '';

        const target = quoted || m.quoted;
        if (target && (target.text || target.body || target.message?.conversation)) {
            content = target.text || target.body || target.message?.conversation || '';
        }
        else if (text && text.trim().length > 0) {
            content = text.trim();
        }
        else {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • RAW UPLOAD •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to text/code :.raw
│ ❏ Type directly :.raw console.log("hello");
│ ❏ Multi-line :.raw \`\`\`js
│    const x = 1;
│    \`\`\`
╰─────────────────────────╯`
            );
        }

        let cleanContent = content;
        if (content.startsWith('```') && content.endsWith('```')) {
            cleanContent = content.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
        }

        if (!cleanContent.trim()) {
            return reply('✘ No content to upload');
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '📤', key: m.key } });

            const form = new FormData();
            form.append('file', Buffer.from(cleanContent), {
                filename: 'paste.txt',
                contentType: 'text/plain',
            });

            const res = await axios.post(`${CDN_URL}/upload`, form, {
                headers: form.getHeaders(),
                timeout: 60000,
            });

            const url = res.data?.url;
            if (!url) return reply('✘ No URL returned');

            const rawUrl = url.replace(/\/(upload|file)\//, '/raw/').replace(/\.html?$/, '.txt');

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • UPLOAD COMPLETE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RAW LINK*
│ ❏ Tap button below to copy
╰─────────────────────────╯

${rawUrl}`,
                nativeFlow: [{
                    text: '📋 Copy URL',
                    copy: rawUrl
                }]
            }, { quoted: m });

        } catch (err) {
            console.error('[RAW]', err.message);
            reply('✘ Upload failed — CDN might not support text uploads');
        }
    }
};