const BOT_NAME = process.env.BOT_NAME || 'XADON'; // <- From.env
const yts = require('yt-search');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// RAPID API ROTATION
const RAPID_API_KEYS = [
    process.env.RAPID_KEY_1 || 'f33faab7b9msh7debbd81b2366c6p10e535jsn94995ebe4cbe',
    process.env.RAPID_KEY_2 || 'bebbe34903msh5b866dbc4eeee83p1015f4jsnfa9f6d69aca9',
    process.env.RAPID_KEY_3 || '26326ad4e2msha67982d35518d98p1f16aejsn2758906787c6'
];
const RAPID_API_HOST = 'youtube-mp36.p.rapidapi.com';
const COUNTER_FILE = path.join(__dirname, '../../upstream_counter.json');

function getCounter() {
    if (fs.existsSync(COUNTER_FILE)) {
        const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8'));
        return data.index || 0;
    }
    return 0;
}
function saveCounter(index) {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ index }, null, 2));
}
function getCurrentApiKey() {
    const counter = getCounter();
    return { apiKey: RAPID_API_KEYS[counter % RAPID_API_KEYS.length], counter };
}
function nextKey() {
    const counter = getCounter() + 1;
    saveCounter(counter);
    return RAPID_API_KEYS[counter % RAPID_API_KEYS.length];
}

function extractYouTubeId(url) {
    if (!url) return null;
    const regexes = [
        /youtube\.com\/watch\?v=([\w-]{11})/,
        /youtube\.com\/shorts\/([\w-]{11})/,
        /youtube\.com\/embed\/([\w-]{11})/,
        /youtu\.be\/([\w-]{11})/
    ];
    for (const regex of regexes) {
        const match = url.match(regex);
        if (match) return match[1];
    }
    return /^[\w-]{11}$/.test(url)? url : null;
}

function decryptSaveTubePayload(data) {
    const key = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
    const buffer = Buffer.from(data, 'base64');
    const iv = buffer.subarray(0, 16);
    const encrypted = buffer.subarray(16);
    const keyBuffer = Buffer.from(key.match(/.{1,2}/g).join(''), 'hex');
    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
}

async function postJson(url, body, headers = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'origin': 'https://yt.savetube.me',
            'referer': 'https://yt.savetube.me/',
            'user-agent': 'Mozilla/5.0',
          ...headers
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.json();
}

async function getJson(url, headers = {}) {
    const res = await fetch(url, {
        headers: { 'accept': '*/*', 'user-agent': 'Mozilla/5.0',...headers }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.json();
}

async function getAudioScraper(url) {
    const videoId = extractYouTubeId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');
    const ytUrl = 'https://www.youtube.com/watch?v=' + videoId;
    const errors = [];

    // Try SaveTube
    try {
        const cdnData = await getJson('https://media.savetube.vip/api/random-cdn');
        const cdn = cdnData.cdn;
        if (!cdn) throw new Error('Missing CDN host');

        const info = await postJson(`https://${cdn}/v2/info`, { url: ytUrl }, { origin: 'https://yt.savetube.me', referer: 'https://yt.savetube.me/' });
        const decrypted = decryptSaveTubePayload(info.data);

        const dl = await postJson(`https://${cdn}/v2/download`, { downloadType: 'audio', quality: 128, key: decrypted.key }, { origin: 'https://mp3juice3.ninja', referer: 'https://mp3juice3.ninja/' });
        const downloadUrl = dl?.data?.downloadUrl;
        if (!downloadUrl) throw new Error('Missing direct download URL');

        const audioRes = await fetch(downloadUrl);
        const buffer = Buffer.from(await audioRes.arrayBuffer());
        return {
            provider: 'savetube',
            buffer,
            title: decrypted.title,
            thumbnail: decrypted.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            duration: decrypted.duration || 'Unknown'
        };
    } catch (e) { errors.push('savetube: ' + e.message); }

    // Try CNVMP3
    try {
        const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Origin': 'https://cnvmp3.com', 'Referer': 'https://cnvmp3.com/v54', 'User-Agent': 'Mozilla/5.0' };
        const res1 = await fetch('https://cnvmp3.com/get_video_data.php', { method: 'POST', headers, body: JSON.stringify({ url: ytUrl, token: '1234' }) });
        if (!res1.ok) throw new Error('init failed: HTTP ' + res1.status);
        const data1 = await res1.json();
        if (!data1.success ||!data1.title) throw new Error(data1.error || 'missing title');

        const res2 = await fetch('https://cnvmp3.com/download_video_ucep.php', { method: 'POST', headers, body: JSON.stringify({ url: ytUrl, quality: 4, title: data1.title, formatValue: 1 }) });
        if (!res2.ok) throw new Error('download failed: HTTP ' + res2.status);
        const data2 = await res2.json();
        if (!data2.success ||!data2.download_link) throw new Error(data2.error || 'missing download link');

        const audioRes = await fetch(data2.download_link);
        const buffer = Buffer.from(await audioRes.arrayBuffer());
        return { provider: 'cnvmp3', buffer, title: data1.title, thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, duration: data1.duration || 'Unknown' };
    } catch (e) { errors.push('cnvmp3: ' + e.message); }

    throw new Error('All scrapers failed: ' + errors.join(' | '));
}

async function getAudioRapidAPI(videoId, attempt = 0) {
    const { apiKey, counter } = getCurrentApiKey();
    const keyNum = counter % RAPID_API_KEYS.length + 1;
    console.log(`⚠️ Using RapidAPI backup: key ${keyNum}/${RAPID_API_KEYS.length}`);

    try {
        const res = await axios.get('https://youtube-mp36.p.rapidapi.com/dl', {
            params: { id: videoId },
            headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': RAPID_API_HOST },
            timeout: 30000
        });
        const data = res.data;
        if (data?.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            return await getAudioRapidAPI(videoId, attempt);
        }
        if (data?.status!== 'ok' ||!data?.link) throw new Error('Download failed');

        const audioRes = await axios.get(data.link, { responseType: 'arraybuffer', timeout: 60000 });
        nextKey();
        return { buffer: Buffer.from(audioRes.data), title: data.title };
    } catch (err) {
        if (attempt < RAPID_API_KEYS.length) {
            console.log(`⚠️ RapidAPI key ${keyNum} failed, trying next...`);
            nextKey();
            return await getAudioRapidAPI(videoId, attempt + 1);
        }
        throw err;
    }
}

module.exports = {
    name: 'upstream',
    alias: ['vmusic', 'pipmusic', 'ytpip'],
    desc: '🎬 YouTube audio with large PiP video preview',
    category: 'Music',
    usage: '.upstream <song title or URL>',
    examples: ['.upstream assurance by Davido', '.upstream https://youtu.be/xxxxx'],
    reactions: { start: '🎬', success: '✅', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const query = args.join(' ');
        if (!query) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} UPSTREAM PLAYER 🎬*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *📖 HOW TO USE*
│ ❏ Command : ${prefix}upstream <song title or URL>
╰─────────────────────────╯
╭─֎ *📝 EXAMPLES*
│ ❏ ${prefix}upstream assurance by Davido
│ ❏ ${prefix}upstream https://youtu.be/xxxxx
╰─────────────────────────╯

_*💡 Audio + Large Video Preview*_`
        );

        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });

        try {
            const isUrl = extractYouTubeId(query)!== null;
            let videoId, title, author, duration, thumbnail;

            if (isUrl) {
                videoId = extractYouTubeId(query);
                const search = await yts('https://youtu.be/' + videoId);
                if (search.videos.length) {
                    const v = search.videos[0];
                    title = v.title; author = v.author.name; duration = v.duration; thumbnail = v.thumbnail;
                } else {
                    title = 'YouTube Audio'; author = 'Unknown'; duration = 'Unknown'; thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }
            } else {
                const search = await yts(query);
                if (!search.videos.length) {
                    await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return reply('_*❌ No results found*_');
                }
                const v = search.videos[0];
                videoId = v.videoId; title = v.title; author = v.author.name; duration = v.duration; thumbnail = v.thumbnail;
            }

            let audioData, isBackup = false;
            try {
                audioData = await getAudioScraper(`https://youtu.be/${videoId}`);
                console.log('✓ Scraper success:', audioData.provider);
            } catch (err) {
                console.log('Scraper failed:', err.message);
                try {
                    const rapid = await getAudioRapidAPI(videoId);
                    audioData = { provider: 'rapidapi', buffer: rapid.buffer, title: rapid.title || title, thumbnail, duration };
                    isBackup = true;
                } catch (err2) {
                    throw new Error('Both scrapers and RapidAPI failed.\nScraper: ' + err.message + '\nRapidAPI: ' + err2.message);
                }
            }

            let thumbBuffer = null;
            try {
                const thumbRes = await axios.get(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, { responseType: 'arraybuffer', timeout: 10000 });
                thumbBuffer = Buffer.from(thumbRes.data);
            } catch {
                try {
                    const thumbRes2 = await axios.get(thumbnail, { responseType: 'arraybuffer', timeout: 5000 });
                    thumbBuffer = Buffer.from(thumbRes2.data);
                } catch (e) { console.log('Thumbnail fetch failed:', e.message); }
            }

            const status = isBackup? '⚠️ Using Backup' : `✓ ${audioData.provider} (Primary)`;
            const ytLink = `https://youtu.be/${videoId}`;

            await sock.sendMessage(m.chat, {
                audio: audioData.buffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title.substring(0, 32),
                        body: `By ${author} • ${duration}\n🎬 PIP MODE | ${status}`,
                        mediaType: 2, // Large PiP preview
                        thumbnail: thumbBuffer,
                        thumbnailUrl: thumbnail,
                        mediaUrl: ytLink,
                        sourceUrl: ytLink,
                        showAdAttribution: false,
                        renderLargerThumbnail: true
                    }
                }
            });

            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        } catch (err) {
            console.error('[UPSTREAM ERROR]', err);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await reply(`_*❌ Error: ${err.message}*_`);
        }
    }
};