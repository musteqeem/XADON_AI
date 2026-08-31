const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

// Helper to send with UI
const sendAnime = async (sock, m, title, data, type = 'image') => {
    const jid = m.key.remoteJid;
    const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ${title.toUpperCase()} •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

    let caption = `${header}\n╭─֎ *${type}*\n`;
    if(data.tags) caption += `│ ❏ Tags : ${data.tags.slice(0,5).join(', ')}\n`;
    if(data.artist) caption += `│ ❏ Artist : ${data.artist}\n`;
    caption += `╰─────────────────────────╯`;

    await sock.sendMessage(jid, {
        image: { url: data.url },
        caption
    }, { quoted: m });
}

module.exports = [
{
    name: 'husbando', alias: ['husband'], category: 'Anime', desc: 'Random husbando', usage: '.husbando',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "👨", key: m.key } });
        const {data} = await axios.get('https://api.waifu.pics/sfw/husbando');
        await sendAnime(sock, m, 'Husbando', {url: data.url, tags: ['husbando']});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'shinobu', alias: [], category: 'Anime', desc: 'Random shinobu pics', usage: '.shinobu',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🦋", key: m.key } });
        const {data} = await axios.get('https://api.waifu.pics/sfw/shinobu');
        await sendAnime(sock, m, 'Shinobu', {url: data.url, tags: ['shinobu']});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'megumin', alias: [], category: 'Anime', desc: 'Random megumin pics', usage: '.megumin',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "💥", key: m.key } });
        const {data} = await axios.get('https://api.waifu.pics/sfw/megumin');
        await sendAnime(sock, m, 'Megumin', {url: data.url, tags: ['megumin', 'explosion']});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xbully', alias: [], category: 'Anime', desc: 'Anime bully gif', usage: '.bully',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "👊", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=bully&IsNsfw=False');
        await sendAnime(sock, m, 'Bully', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xcuddle', alias: [], category: 'Anime', desc: 'Anime cuddle gif', usage: '.cuddle',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🤗", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=cuddle&IsNsfw=False');
        await sendAnime(sock, m, 'Cuddle', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xcry', alias: [], category: 'Anime', desc: 'Anime cry gif', usage: '.cry',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "😢", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=cry&IsNsfw=False');
        await sendAnime(sock, m, 'Cry', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xhug', alias: [], category: 'Anime', desc: 'Anime hug gif', usage: '.hug',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🫂", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=hug&IsNsfw=False');
        await sendAnime(sock, m, 'Hug', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xkiss', alias: [], category: 'Anime', desc: 'Anime kiss gif', usage: '.kiss',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "💋", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=kiss&IsNsfw=False');
        await sendAnime(sock, m, 'Kiss', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xlick', alias: [], category: 'Anime', desc: 'Anime lick gif', usage: '.lick',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "👅", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=lick&IsNsfw=False');
        await sendAnime(sock, m, 'Lick', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xpat', alias: [], category: 'Anime', desc: 'Anime headpat gif', usage: '.pat',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "👋", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=pat&IsNsfw=False');
        await sendAnime(sock, m, 'Pat', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xsmug', alias: [], category: 'Anime', desc: 'Anime smug gif', usage: '.smug',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "😏", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=smug&IsNsfw=False');
        await sendAnime(sock, m, 'Smug', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'xbonk', alias: [], category: 'Anime', desc: 'Anime bonk gif', usage: '.bonk',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🔨", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=bonk&IsNsfw=False');
        await sendAnime(sock, m, 'Bonk', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'yeet', alias: [], category: 'Anime', desc: 'Anime yeet gif', usage: '.yeet',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "🚀", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=yeet&IsNsfw=False');
        await sendAnime(sock, m, 'Yeet', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'blush', alias: [], category: 'Anime', desc: 'Anime blush gif', usage: '.blush',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "☺️", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=blush&IsNsfw=False');
        await sendAnime(sock, m, 'Blush', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
},
{
    name: 'smile', alias: [], category: 'Anime', desc: 'Anime smile gif', usage: '.smile',
    execute: async (sock, m) => {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "😊", key: m.key } });
        const {data} = await axios.get('https://api.waifu.im/images?IncludedTags=smile&IsNsfw=False');
        await sendAnime(sock, m, 'Smile', {url: data.items[0].url, tags: data.items[0].tags.map(t=>t.name)});
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✓", key: m.key } });
    }
}
];