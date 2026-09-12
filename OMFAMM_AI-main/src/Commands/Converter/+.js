const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const AI_GATEWAY = 'https://api.crysnovax.link'; // change if needed
const AI_TOKEN = process.env.AI_TOKEN || 'x';
const TTS_GATEWAY = 'https://api.crysnovax.link/tools/tts?text=';
const TTS_TOKEN = process.env.TTS_TOKEN || 'x';
const CHUNK_SIZE = 180;
const MAX_TOTAL_CHARS = 1600;

function splitTextIntoChunks(text, maxLen) {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    const chunks = [];
    let current = '';
    for (const sentence of sentences) {
        if ((current + sentence).length <= maxLen) {
            current += sentence;
        } else {
            if (current) chunks.push(current.trim());
            current = sentence;
        }
    }
    if (current) chunks.push(current.trim());
    return chunks;
}

async function downloadTTSChunk(text, filePath) {
    const url = `${TTS_GATEWAY}${encodeURIComponent(text)}&token=${TTS_TOKEN}`;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(filePath, Buffer.from(res.data));
}

async function concatenateMP3s(chunks, outputPath) {
    const listPath = `${outputPath}.list.txt`;
    const listContent = chunks.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listPath, listContent);
    return new Promise((resolve, reject) => {
        const cmd = `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
        exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
            try { fs.unlinkSync(listPath); } catch {}
            if (err) reject(new Error(`FFmpeg concat failed: ${stderr || err.message}`));
            else resolve();
        });
    });
}

async function convertToVoiceNote(mp3Path, oggPath) {
    return new Promise((resolve, reject) => {
        const cmd = `ffmpeg -i "${mp3Path}" -ac 1 -ar 48000 -c:a libopus -b:a 16k "${oggPath}" -y`;
        exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
            if (err) reject(new Error(`FFmpeg conversion failed: ${stderr || err.message}`));
            else resolve();
        });
    });
}

module.exports = {
    name: 'luna',
    alias: ['lvoice', 'lunav'],
    category: 'AI',
    desc: 'Luna AI Voice – Smart AI answers via Gemini + TTS',
    usage: '.luna What is AI?',

    execute: async (sock, m, { args, reply }) => {
        const question = args.join(' ').trim();
        if (!question) return reply(`֎ ֎ Ask Luna something.\n❏ Example:.luna Explain quantum physics`);

        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const timestamp = Date.now();
        const chunkFiles = [];
        const concatPath = path.join(tempDir, `luna_${timestamp}_concat.mp3`);
        const voicePath = path.join(tempDir, `luna_${timestamp}.ogg`);

        try {
            await sock.sendMessage(m.chat, { react: { text: '🎙️', key: m.key } });

            // 1. Get AI answer from Gemini
            const aiPrompt = `You are a highly intelligent and helpful AI assistant. Give a direct, accurate, and informative answer to this question. Be concise but thorough. Question: ${question}`;
            const aiRes = await axios.get(
                `${AI_GATEWAY}/ai/gemini?text=${encodeURIComponent(aiPrompt)}&token=${AI_TOKEN}`,
                { timeout: 45000 }
            );
            let answer = aiRes.data?.result || '';

            // 2. Anti-flirt filter
            if (answer.includes('darling') || answer.includes('handsome') || answer.includes('flirty')) {
                const safePrompt = `SYSTEM: You are a professional AI. No flirting. No roleplay. Just facts.\n\nUSER: ${question}`;
                const safeRes = await axios.get(
                    `${AI_GATEWAY}/ai/gemini?text=${encodeURIComponent(safePrompt)}&token=${AI_TOKEN}`,
                    { timeout: 45000 }
                );
                answer = safeRes.data?.result || answer;
            }

            if (!answer || answer.length < 10) return reply('✘ ֎ Luna returned no response.');

            // 3. Clean markdown
            answer = answer
               .replace(/[*_~`#]/g, '')
               .replace(/\[.*?\]\(.*?\)/g, '')
               .replace(/\n{3,}/g, '. ')
               .replace(/\n/g, '. ')
               .replace(/\s{2,}/g, ' ')
               .trim();

            if (answer.length > MAX_TOTAL_CHARS) answer = answer.slice(0, MAX_TOTAL_CHARS) + '... truncated.';

            // 4. Split and TTS each chunk
            const chunks = splitTextIntoChunks(answer, CHUNK_SIZE);
            if (chunks.length === 0) return reply('✘ ֎ No text to speak.');

            await reply(`֎ Generating voice... ${chunks.length} part(s)`);

            for (let i = 0; i < chunks.length; i++) {
                const chunkPath = path.join(tempDir, `luna_${timestamp}_chunk_${i}.mp3`);
                await downloadTTSChunk(chunks[i], chunkPath);
                chunkFiles.push(chunkPath);
            }

            // 5. Concat + Convert to Opus
            await concatenateMP3s(chunkFiles, concatPath);
            await convertToVoiceNote(concatPath, voicePath);

            // 6. Send as voice note
            if (fs.existsSync(voicePath) && fs.statSync(voicePath).size > 0) {
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(voicePath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: m });
            }

        } catch (e) {
            console.error('[LUNA ERROR]', e.message);
            reply('✘ ֎ Voice generation failed');
        } finally {
            // Cleanup
            if (fs.existsSync(concatPath)) fs.unlinkSync(concatPath);
            if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
            for (const f of chunkFiles) {
                if (fs.existsSync(f)) fs.unlinkSync(f);
            }
        }
    }
};