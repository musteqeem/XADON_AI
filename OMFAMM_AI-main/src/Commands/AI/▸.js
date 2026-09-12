const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const TEMP_DIR = path.join(__dirname, '../../../temp');
const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN || 'pQzBeAuNetmItgy6kVyuIO53bCJuYiNp1Q5sbhLe';

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// 3 AUDIO APIs
const AUDIO_APIS = [
    {
        name: 'Freesound',
        search: async (query) => {
            const url = `https://freesound.org/apiv2/search/?query=${encodeURIComponent(query)}&fields=id,name,previews&token=${FREESOUND_TOKEN}`;
            const { data } = await axios.get(url, { timeout: 10000 });
            const results = data.results || [];
            if (!results.length) return null;
            for (const item of results) {
                const url = item.previews?.['preview-hq-mp3'] || item.previews?.['preview-lq-mp3'];
                if (url) return { url, name: item.name };
            }
            return null;
        }
    },
    {
        name: 'Pixabay Music',
        search: async (query) => {
            const url = `https://pixabay.com/api/?key=free-key&q=${encodeURIComponent(query)}&music_type=background`;
            const { data } = await axios.get(url, { timeout: 10000 });
            if (data.hits?.length) return { url: data.hits[0].previewURL, name: data.hits[0].tags };
            return null;
        }
    },
    {
        name: 'Silent',
        search: async () => null
    }
];

const downloadImage = async (url, filepath) => {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
    fs.writeFileSync(filepath, Buffer.from(res.data));
    return filepath;
};

const downloadAudio = async (url, filepath) => {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
    fs.writeFileSync(filepath, Buffer.from(res.data));
    return filepath;
};

const createVideo = (imagePath, outputPath, audioPath = null, duration = 5) => {
    return new Promise((resolve, reject) => {
        const fadeDuration = Math.min(0.8, duration - 0.8);
        let cmd;

        if (audioPath && fs.existsSync(audioPath)) {
            cmd = `"${ffmpegPath}" -loop 1 -i "${imagePath}" -i "${audioPath}" -vf "zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)+sin(on*0.03)*10':y='ih/2-(ih/zoom/2)+cos(on*0.02)*8':s=1024x1024,fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${duration-fadeDuration}:d=${fadeDuration}" -pix_fmt yuv420p -preset ultrafast -shortest -c:a aac -b:a 64k -af "afade=t=in:st=0:d=${fadeDuration},afade=t=out:st=${duration-fadeDuration}:d=${fadeDuration}" -y "${outputPath}"`;
        } else {
            cmd = `"${ffmpegPath}" -loop 1 -i "${imagePath}" -vf "zoompan=z='min(zoom+0.0015,1.5)':d=125:x='iw/2-(iw/zoom/2)+sin(on*0.03)*10':y='ih/2-(ih/zoom/2)+cos(on*0.02)*8':s=1024x1024,fade=t=in:st=0:d=${fadeDuration},fade=t=out:st=${duration-fadeDuration}:d=${fadeDuration}" -pix_fmt yuv420p -preset ultrafast -t ${duration} -y "${outputPath}"`;
        }

        exec(cmd, (err) => {
            if (err) return reject(err);
            resolve(outputPath);
        });
    });
};

module.exports = {
    name: 'genvideo',
    alias: ['aivideo', 'imgtovideo', 'videogen'],
    desc: `${BOT_NAME} Generate AI video with cinematic motion and matching sound`,
    category: 'AI',
    usage: '.videogen <prompt> |.videogen <prompt> | <seconds> |.videogen <prompt> | <seconds> | nosound',
    reactions: { start: '🎬', success: '🎥' },

    execute: async (sock, m, { args, reply, quoted }) => {
        let prompt = args.join(' ').trim();
        if (!prompt && quoted) prompt = quoted.text || quoted.conversation || quoted.message?.conversation || '';

        if (!prompt) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} AI VIDEO GEN •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏.videogen <prompt>\n│ ❏.videogen <prompt> | <seconds>\n│ ❏.videogen <prompt> | <seconds> | nosound\n│ \n│ ❏ *Examples:*\n│ ❏.videogen cat in space\n│ ❏.videogen sunset beach | 8\n│ ❏.videogen thunderstorm | 10 | nosound\n╰─────────────────────────╯`);
        }

        let finalPrompt = prompt;
        let duration = 5;
        let withSound = true;

        const parts = prompt.split('|');
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1].trim().toLowerCase();
            if (lastPart === 'nosound' || lastPart === 'mute' || lastPart === 'silent') {
                withSound = false;
                parts.pop();
            } else {
                const sec = parseFloat(lastPart);
                if (!isNaN(sec) && sec > 0 && sec <= 15) {
                    duration = sec;
                    parts.pop();
                }
            }
            finalPrompt = parts.join('|').trim();
        }

        if (!finalPrompt) return reply(`✘ ❏ Provide a prompt`);

        await sock.sendMessage(m.chat, { react: { text: '🎬', key: m.key } }).catch(() => {});

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&nologo=true`;
        const timestamp = Date.now();
        const imgPath = path.join(TEMP_DIR, `img_${timestamp}.jpg`);
        const audioPath = path.join(TEMP_DIR, `audio_${timestamp}.mp3`);
        const videoPath = path.join(TEMP_DIR, `vid_${timestamp}.mp4`);

        try {
            await downloadImage(imageUrl, imgPath);

            let audioFound = false;
            let audioName = 'Silent';
            if (withSound) {
                const sound = await AUDIO_APIS[0].search(finalPrompt);
                if (sound) {
                    try {
                        await downloadAudio(sound.url, audioPath);
                        audioFound = true;
                        audioName = sound.name.slice(0, 28);
                    } catch {
                        audioName = 'Silent (download failed)';
                    }
                } else {
                    audioName = 'Silent (no match found)';
                }
            }

            await createVideo(imgPath, videoPath, audioFound? audioPath : null, duration);

            await sock.sendMessage(m.chat, {
                video: { url: videoPath },
                mimetype: 'video/mp4',
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} AI VIDEO •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Prompt:* ${finalPrompt}\n❏ *Duration:* ${duration}s\n❏ *Audio:* ${audioName}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            // cleanup
            try { fs.unlinkSync(imgPath); fs.unlinkSync(videoPath); if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {}

            await sock.sendMessage(m.chat, { react: { text: '🎥', key: m.key } }).catch(() => {});

        } catch (err) {
            console.error('[VIDEOGEN]', err.message);
            try { fs.unlinkSync(imgPath); } catch {}
            try { if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath); } catch {}
            try { fs.unlinkSync(videoPath); } catch {}
            try {
                await sock.sendMessage(m.chat, { image: { url: imageUrl } }, { quoted: m });
            } catch {
                reply(`✘ ❏ Failed\n𓄇 ${err.message}`);
            }
        }
    }
};