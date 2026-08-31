const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const BASE = 'https://nekos.life/api/v2';

// 20+ SFW actions with 'a' prefix
const SFW_ACTIONS = [
    { name: 'ahug', alias: ['ahugme'], desc: 'Send a hug', emoji: '🫂', endpoint: 'hug' },
    { name: 'akiss', alias: ['akissme'], desc: 'Send a kiss', emoji: '💋', endpoint: 'kiss' },
    { name: 'apat', alias: ['apatme', 'aheadpat'], desc: 'Give a headpat', emoji: '👋', endpoint: 'pat' },
    { name: 'acuddle', alias: ['acuddleme'], desc: 'Cuddle someone', emoji: '🤗', endpoint: 'cuddle' },
    { name: 'aslap', alias: ['aslapme'], desc: 'Slap someone', emoji: '✋', endpoint: 'slap' },
    { name: 'atickle', alias: ['atickleme'], desc: 'Tickle someone', emoji: '😆', endpoint: 'tickle' },
    { name: 'afeed', alias: ['afeedme'], desc: 'Feed someone', emoji: '🍽️', endpoint: 'feed' },
    { name: 'ameow', alias: ['ameowme'], desc: 'Random meow gif', emoji: '🐱', endpoint: 'meow' },
    { name: 'awoof', alias: ['awoofme', 'adoggo'], desc: 'Random dog gif', emoji: '🐶', endpoint: 'woof' },
    { name: 'angif', alias: ['anekogif'], desc: 'Random neko gif', emoji: '🐱', endpoint: 'ngif' },
    { name: 'asmug', alias: ['asmugme'], desc: 'Smug face', emoji: '😏', endpoint: 'smug' },
    { name: 'agasm', alias: ['agasmme'], desc: 'Gasm face', emoji: '😩', endpoint: 'gasm' },
    { name: 'agecg', alias: ['agecgme'], desc: 'Catgirl', emoji: '🧬', endpoint: 'gecg' },
    { name: 'agoose', alias: ['agooseme'], desc: 'Random goose', emoji: '🪿', endpoint: 'goose' },
    { name: 'afoxgirl', alias: ['afox', 'afox_girl'], desc: 'Fox girl', emoji: '🦊', endpoint: 'fox_girl' },
    { name: 'aneko', alias: ['anekogirl', 'acatgirl'], desc: 'Neko girl', emoji: '🐱', endpoint: 'neko' },
    { name: 'awaifu', alias: ['awaifupic'], desc: 'Random waifu', emoji: '🎌', endpoint: 'waifu' },
    { name: 'aavatar', alias: ['aanimeavatar', 'aav'], desc: 'Anime avatar', emoji: '🖼️', endpoint: 'avatar' },
    { name: 'awallpaper', alias: ['aanimewall', 'aanimewallpaper'], desc: 'Anime wallpaper', emoji: '🌆', endpoint: 'wallpaper' },
    { name: 'ablush', alias: ['ablushme'], desc: 'Blush', emoji: '☺️', endpoint: 'blush' },
    { name: 'asmile', alias: ['asmileme'], desc: 'Smile', emoji: '😊', endpoint: 'smile' },
    { name: 'apoke', alias: ['apokeme'], desc: 'Poke someone', emoji: '👉', endpoint: 'poke' },
    { name: 'ayawn', alias: ['ayawnme'], desc: 'Yawn', emoji: '🥱', endpoint: 'yawn' },
    { name: 'abaka', alias: ['abakame'], desc: 'Baka', emoji: '💢', endpoint: 'baka' },
    { name: 'awave', alias: ['awaveme'], desc: 'Wave', emoji: '👋', endpoint: 'wave' },
    { name: 'acringe', alias: ['acringeme'], desc: 'Cringe', emoji: '😬', endpoint: 'cringe' },
    { name: 'adance', alias: ['adanceme'], desc: 'Dance', emoji: '💃', endpoint: 'dance' },
];

// 10+ NSFW actions with 'a' prefix
const NSFW_ACTIONS = [
    { name: 'alewd', alias: ['alewdme'], desc: 'Lewd image', emoji: '🔞', endpoint: 'lewd' },
    { name: 'aspank', alias: ['aspankme'], desc: 'Spank someone', emoji: '👋', endpoint: 'spank' },
    { name: 'av3', alias: ['ansfwneko'], desc: 'NSFW Neko', emoji: '🔞', endpoint: 'v3' },
    { name: 'akemonomimi', alias: ['akemonomimigirl'], desc: 'Kemonomimi', emoji: '🔞', endpoint: 'kemonomimi' },
    { name: 'akuni', alias: ['akunime'], desc: 'Kuni', emoji: '🔞', endpoint: 'kuni' },
    { name: 'akissnsfw', alias: ['akissnsfwme'], desc: 'NSFW Kiss', emoji: '🔞', endpoint: 'kiss' },
    { name: 'aboobs', alias: ['aboobsme'], desc: 'Boobs', emoji: '🔞', endpoint: 'boobs' },
    { name: 'apussy', alias: ['apussyme'], desc: 'Pussy', emoji: '🔞', endpoint: 'pussy' },
    { name: 'atits', alias: ['atitspic'], desc: 'Tits', emoji: '🔞', endpoint: 'tits' },
    { name: 'afeet', alias: ['afeetpic'], desc: 'Feet', emoji: '🔞', endpoint: 'feet' },
];

// 10+ Utility/Fun commands
const UTILITY_ACTIONS = [
    { name: 'anekofact', alias: ['aanimefact', 'afact'], desc: 'Get a random fact', emoji: '📚', type: 'text', endpoint: 'fact' },
    { name: 'anekoname', alias: ['aanimename', 'arandomname'], desc: 'Generate anime name', emoji: '📛', type: 'text', endpoint: 'name' },
    { name: 'aowoify', alias: ['aowo', 'aowotext'], desc: 'OwOify text', emoji: '😸', type: 'query', endpoint: 'owoify' },
    { name: 'awhy', alias: ['anekoswhy'], desc: 'Get random why', emoji: '🤔', type: 'text', endpoint: 'why' },
    { name: 'acat', alias: ['anekocat'], desc: 'Random cat', emoji: '🐱', type: 'image', endpoint: 'cat', key: 'cat' },
    { name: 'a8ball', alias: ['anekos8ball', 'aask'], desc: 'Magic 8ball', emoji: '🎱', type: '8ball', endpoint: '8ball' },
    { name: 'aspoiler', alias: ['anekospoiler'], desc: 'Spoiler text', emoji: '🫣', type: 'query', endpoint: 'spoiler' },
    { name: 'achat', alias: ['anekoschat', 'aaichat'], desc: 'Chat with Nekos AI', emoji: '💬', type: 'query', endpoint: 'chat' },
    { name: 'acapoo', alias: ['acapooify'], desc: 'Capooify text', emoji: '🐶', type: 'query', endpoint: 'capoo' },
    { name: 'afilter', alias: ['anekofilter'], desc: 'Filter text', emoji: '🔤', type: 'query', endpoint: 'filter' },
];

const isGifEndpoint = ['ngif', 'meow', 'woof', 'gasm'].includes;

// Generate SFW commands
const sfwCommands = SFW_ACTIONS.map(action => ({
    name: action.name,
    alias: action.alias,
    category: 'Anime',
    desc: action.desc,
    usage: `.${action.name} [@mention]`,
    owner: false,
    execute: async (sock, m, { reply, mentioned }) => {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: action.emoji, key: m.key } });
        try {
            const { data } = await axios.get(`${BASE}/img/${action.endpoint}`, { timeout: 15000 });
            const imageUrl = data?.url;
            if (!imageUrl) return reply(`✘ ֎ ${action.name} failed\n❏ API : nekos.life`);

            let caption = `֎ *${BOT_NAME} - ${action.desc}*\n❏ Source : nekos.life`;
            if (mentioned?.[0]) {
                const sender = m.pushName || 'Someone';
                const target = '@' + mentioned[0].split('@')[0];
                caption = `֎ *${sender} ${action.endpoint}s ${target}*`;
            }

            const isGif = isGifEndpoint(action.endpoint);
            await sock.sendMessage(jid, {
                [isGif? 'video' : 'image']: { url: imageUrl },
                caption,
                gifPlayback: isGif,
                mentions: mentioned || []
            }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
        } catch (err) {
            console.error(`[${action.name}]`, err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ ${action.name} failed\n❏ Error : ${err.message}`);
        }
    }
}));

// Generate NSFW commands
const nsfwCommands = NSFW_ACTIONS.map(action => ({
    name: action.name,
    alias: action.alias,
    category: 'NSFW',
    desc: action.desc,
    usage: `.${action.name}`,
    owner: false,
    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: action.emoji, key: m.key } });
        try {
            const { data } = await axios.get(`${BASE}/img/${action.endpoint}`, { timeout: 15000 });
            const imageUrl = data?.url;
            if (!imageUrl) return reply(`✘ ֎ ${action.name} failed\n❏ API : nekos.life`);

            await sock.sendMessage(jid, {
                image: { url: imageUrl },
                caption: `֎ *${BOT_NAME} - ${action.desc}*\n❏ Warning : NSFW`
            }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
        } catch (err) {
            console.error(`[${action.name}]`, err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ ${action.name} failed\n❏ Error : ${err.message}`);
        }
    }
}));

// Generate Utility commands
const utilityCommands = UTILITY_ACTIONS.map(action => ({
    name: action.name,
    alias: action.alias,
    category: 'Fun',
    desc: action.desc,
    usage: `.${action.name} ${action.type === 'query' || action.type === '8ball'? '<text>' : ''}`,
    owner: false,
    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { react: { text: action.emoji, key: m.key } });
        try {
            let url = `${BASE}/${action.endpoint}`;
            if (action.type === 'query' || action.type === '8ball') {
                const text = args.join(' ').trim();
                if (!text) return reply(`✘ ֎ Provide text for ${action.name}`);
                url += `?text=${encodeURIComponent(text)}`;
            }

            const { data } = await axios.get(url, { timeout: 15000 });

            if (action.type === 'image') {
                const imageUrl = data[action.key];
                await sock.sendMessage(jid, { image: { url: imageUrl }, caption: `֎ *${BOT_NAME} - ${action.desc}*` }, { quoted: m });
            } else if (action.type === '8ball') {
                await sock.sendMessage(jid, { text: `🎱 *8BALL*\n\n❏ Q : ${args.join(' ')}\n❏ A : ${data.response}` }, { quoted: m });
            } else if (action.type === 'query') {
                await sock.sendMessage(jid, { text: `֎ *${action.desc.toUpperCase()}*\n\n${data[action.endpoint] || data.owo || data.response}` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `֎ *${action.desc.toUpperCase()}*\n\n${data.fact || data.name || data.why}` }, { quoted: m });
            }
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
        } catch (err) {
            console.error(`[${action.name}]`, err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ ${action.name} failed\n❏ Error : ${err.message}`);
        }
    }
}));

module.exports = [...sfwCommands,...nsfwCommands,...utilityCommands];