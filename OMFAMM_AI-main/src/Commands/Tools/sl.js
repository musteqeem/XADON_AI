const axios = require('axios');

module.exports = [{
    name: 'short',
    alias: ['shorten', 'sl', 'shortlink'],
    category: 'Tools',
    desc: 'Shorten a URL',
    usage: '.short <url> | custom-slug | password | hours',
    reactions: { start: '✂️', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        if (!args.length) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • SHORT LINKER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}short <url>
│
│ ❏ *With custom slug*
│ • ${prefix}short <url> | myslug
│
│ ❏ *With password*
│ • ${prefix}short <url> | slug | password
│
│ ❏ *With expiration*
│ • ${prefix}short <url> | slug | pass | 24
│
│ ❏ *Examples*
│ • ${prefix}short https://ai.crysnovax.link
│ • ${prefix}short https://link.com | mylink
│ • ${prefix}short https://link.com | secret | pass123 | 48
╰─────────────────────────╯`
            );
        }

        const parts = args.join(' ').split('|').map(p => p.trim());
        const longUrl = parts[0];
        const customSlug = parts[1] || undefined;
        const password = parts[2] || undefined;
        const expiresIn = parseInt(parts[3]) || undefined;

        if (!longUrl.startsWith('http')) {
            return reply('✘ Invalid URL. Must start with http');
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '✂️', key: m.key } });

            const res = await axios.post('https://sl.crysnovax.link/api/shorten', {
                url: longUrl,
                slug: customSlug,
                password: password,
                expiresIn: expiresIn
            });

            const data = res.data;
            if (!data.status) return reply(`✘ ${data.error || 'Failed'}`);

            const table = [
                ['Short', data.shortUrl],
                ['Slug', data.slug],
                ['Protected', password? 'Yes' : 'No'],
                ['Expires', data.expiresAt? new Date(data.expiresAt).toLocaleString() : 'Never']
            ];

            await sock.sendMessage(m.chat, {
                image: { url: data.qrUrl },
                headerText: `## ◈ Link Shortened`,
                contentText: '---',
                title: '◈ Short URL Created',
                table: table,
                footerText: '◈ sl.crysnovax.link'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[SHORT]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            if (err.response?.data?.error) {
                reply(`✘ ${err.response.data.error}`);
            } else {
                reply('✘ Shorten failed');
            }
        }
    }
}, {
    name: 'shortinfo',
    alias: ['slinfo', 'linkinfo'],
    category: 'Tools',
    desc: 'Get info about a shortened link',
    usage: '.shortinfo <slug>',
    reactions: { start: '🔍', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const slug = args[0]?.trim().replace('https://sl.crysnovax.link/', '').replace('/', '');
        if (!slug) return reply(`✘ Usage: ${prefix}shortinfo <slug>`);

        try {
            await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

            const res = await axios.get(`https://sl.crysnovax.link/api/info/${slug}`);
            const data = res.data;
            if (!data.status) return reply(`✘ ${data.error || 'Not found'}`);

            const table = [
                ['Short', data.shortUrl],
                ['Slug', data.slug],
                ['Original', data.originalUrl.slice(0, 60) + '...'],
                ['Clicks', data.clicks],
                ['Created', new Date(data.created).toLocaleString()],
                ['Protected', data.hasPassword? 'Yes' : 'No'],
                ['Expires', data.expiresAt? new Date(data.expiresAt).toLocaleString() : 'Never']
            ];

            await sock.sendMessage(m.chat, {
                image: { url: data.qrUrl },
                headerText: `## ◈ Link Info`,
                contentText: '---',
                title: '◈ Statistics',
                table: table,
                footerText: '◈ sl.crysnovax.link'
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[SHORTINFO]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply('✘ Link info failed');
        }
    }
}, {
    name: 'shortdelete',
    alias: ['sldel', 'linkdel'],
    category: 'Tools',
    desc: 'Delete a shortened link',
    usage: '.shortdelete <slug> | <password>',
    reactions: { start: '🗑️', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const parts = args.join(' ').split('|').map(p => p.trim());
        const slug = parts[0]?.replace('https://sl.crysnovax.link/', '').replace('/', '');
        const password = parts[1] || '';

        if (!slug) return reply(`✘ Usage: ${prefix}shortdelete <slug>`);

        try {
            await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } });

            const res = await axios.delete(`https://sl.crysnovax.link/api/delete/${slug}`, {
                data: { password: password || undefined }
            });

            if (res.data.status) {
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
                reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • LINK DELETED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DETAILS*
│ ❏ Slug : ${slug}
│ ❏ Status : Deleted successfully
╰─────────────────────────╯`
                );
            }

        } catch (err) {
            console.error('[SHORTDELETE]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            if (err.response?.data?.error) {
                reply(`✘ ${err.response.data.error}`);
            } else {
                reply('✘ Delete failed');
            }
        }
    }
}];