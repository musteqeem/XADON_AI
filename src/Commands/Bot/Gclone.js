const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'gitclone',
    alias: ['clone', 'git', 'downloadrepo'],
    desc: 'Download any public GitHub repository as ZIP',
    category: 'Owner',
    owner: true,
    usage: '.gitclone <GitHub repo URL>',

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;

        if (!args[0]) {
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} GITCLONE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Usage :.gitclone <GitHub URL>

╭─֎ *EXAMPLE*
│ ❏.gitclone https://github.com/user/repo
╰─────────────────────────╯
❏ Note : Public repos only. Max 90MB`
            );
        }

        let repoUrl = args[0].trim().replace(/\.git$/, '');

        if (!repoUrl.includes('github.com')) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Invalid URL\n❏ Reason : Only github.com supported`);
        }

        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
        if (!match) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Invalid Format\n❏ Example : https://github.com/owner/repo`);
        }

        const [, owner, repo] = match;
        const urls = [
            `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`,
            `https://github.com/${owner}/${repo}/archive/refs/heads/master.zip`
        ];

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });
        await sock.sendPresenceUpdate('composing', m.chat);

        for (const zipUrl of urls) {
            try {
                const res = await axios.get(zipUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    headers: { 'User-Agent': `${BOT_NAME}-Bot` }
                });

                const sizeMB = (res.data.byteLength / 1024 / 1024).toFixed(1);
                if (parseFloat(sizeMB) > 90) {
                    await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                    await sock.sendPresenceUpdate('available', m.chat);
                    return reply(`✘ ֎ File Too Large\n❏ Size : ${sizeMB}MB\n❏ Limit : 90MB for WhatsApp\n❏ Action : Download from GitHub directly`);
                }

                await sock.sendMessage(m.chat, {
                    document: Buffer.from(res.data),
                    mimetype: 'application/zip',
                    fileName: `❏ ${repo}.zip`,
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Repo : ${owner}/${repo}
❏ Size : ${sizeMB}MB
❏ Source : GitHub
❏ Downloaded by : ${BOT_NAME}`
                }, { quoted: m });

                await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });
                await sock.sendPresenceUpdate('available', m.chat);
                return;
            } catch (err) {
                if (err.response?.status === 403) {
                    await sock.sendPresenceUpdate('available', m.chat);
                    return reply(`✘ ֎ Access Denied\n❏ Reason : Rate limited or Private repo\n❏ Fix : Add GITHUB_TOKEN to.env`);
                }
                // try next url = master if main failed
            }
        }

        await sock.sendPresenceUpdate('available', m.chat);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        return reply(`✘ ֎ Download Failed\n❏ Reason : Repo not found, Private, or branch not main/master`);
    }
};