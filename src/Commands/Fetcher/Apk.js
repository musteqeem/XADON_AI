const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const axios = require('axios');

module.exports = {
    name: 'apk',
    alias: ['apkdl', 'getapk'],
    desc: '📲 Stable APK downloader',
    category: 'Tools',
    usage: '.apk <app name>',
    reactions: { start: '📲', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {

        try {
            const query = args.join(' ').trim();

            if (!query)
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} APK DOWNLOADER 📲*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}apk <app name>
╰─────────────────────────╯
╭─֎ *📝 EXAMPLE*
│ ❏ ${prefix}apk whatsapp
│ ❏ ${prefix}apk instagram
│ ❏ ${prefix}apk tiktok
╰─────────────────────────╯

_*💡 ${BOT_NAME} APK Search System*_`
                );

            await sock.sendMessage(m.chat, { react: { text: '📲', key: m.key } });
            await reply(`_*🔍 Searching for ${query} APK...*_`);

            // Kord APK Search API
            const searchApi = `https://api.kord.live/api/apk?q=${encodeURIComponent(query)}`;

            const searchRes = await axios.get(searchApi, { timeout: 30000 });
            const data = searchRes.data;

            if (!data || data.error)
                return reply('_*❌ APK not found. Try different app name*_');

            const appName = data.app_name || query;
            const downloadLink = data.download_url;

            if (!downloadLink)
                return reply('_*❌ Download link not found*_');

            await reply(`_*✅ Found: ${appName} 📲\n⬇️ Downloading APK...*_`);

            // Download APK file
            const fileRes = await axios.get(downloadLink, {
                responseType: 'arraybuffer',
                timeout: 120000
            });

            const buffer = Buffer.from(fileRes.data);

            if (!buffer.length)
                return reply('_*❌ Failed to download APK*_');

            // ⭐ 250MB Limit
            const maxSize = 250 * 1024 * 1024;

            if (buffer.length > maxSize)
                return reply('_*❌ APK too large. Max size: 250MB*_');

            await sock.sendMessage(m.chat, {
                document: buffer,
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${appName}.apk`,
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} APK DOWNLOADER 📲*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📦 APP DETAILS*
│ ❏ Name : ${appName}
│ ❏ Size : ${(buffer.length / 1024 / 1024).toFixed(2)} MB
│ ❏ Status : Download Ready
╰─────────────────────────╯

_*⚠️ Install at your own risk*_
_*📲 Powered by ${BOT_NAME}*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.log('[APK ERROR]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`_*❌ APK download failed\n📝 Reason: ${err.message}*_`);
        }
    }
};