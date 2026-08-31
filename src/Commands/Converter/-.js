const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { exec } = require('child_process');
const config = require('../../../settings/config');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

const GATEWAY_URL = process.env.GATEWAY_URL || config.gateway?.api || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.gateway?.gatewayToken || '';
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
    const url = `${GATEWAY_URL}/tools/tts?token=${encodeURIComponent(GATEWAY_TOKEN)}&text=${encodeURIComponent(text)}`;
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
    name: 'readout',
    alias: ['ro', 'readaloud', 'speak'],
    category: 'AI',
    desc: 'Read aloud text or image content as a voice note. Reply to a message',
    usage: '.readout (reply to text or image)',

    execute: async (sock, m, { reply }) => {
        if (!m.quoted) return reply('֎ ֎ Reply to a text message or image to read aloud.');

        const quoted = m.quoted;
        const mtype = quoted.mtype || '';
        let content = '';

        try {
            await sock.sendMessage(m.chat, { react: { text: '🔊', key: m.key } });

            // Case 1: Text message
            if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
                content = quoted.text || quoted.conversation || '';
            }
            // Case 2: Image message - send to Vision API
            else if (mtype === 'imageMessage') {
                await reply('֎ Analyzing image...');
                const imgBuffer = await quoted.download();
                if (!imgBuffer?.length) return reply('✘ ֎ Failed to download image');

                const form = new FormData();
                form.append('file', imgBuffer, { filename: 'image.jpg' });
                form.append('prompt', 'Describe this image in detail. Include any visible text, objects, colors, and context.');

                const visionRes = await axios.post(
                    `${GATEWAY_URL}/vision?token=${encodeURIComponent(GATEWAY_TOKEN)}`,
                    form,
                    { headers: form.getHeaders(), timeout: 60000 }
                );
                content = visionRes.data?.description || '';
                if (!content) return reply('✘ ֎ Could not analyze image');
            }
            else {
                return reply('✘ ֎ Unsupported message type. Reply to text or image.');
            }

            if (!content.trim()) return reply('✘ ֎ No text content found to read.');

            // Truncate if too long
            if (content.length > MAX_TOTAL_CHARS) {
                content = content.slice(0, MAX_TOTAL_CHARS) + '... (truncated)';
            }

            const chunks = splitTextIntoChunks(content, CHUNK_SIZE);
            if (chunks.length === 0) return reply('✘ ֎ No text to speak.');

            await reply(`֎ Generating voice... ${chunks.length} part(s)`);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const timestamp = Date.now();
            const chunkFiles = [];
            const concatPath = path.join(tempDir, `readout_${timestamp}_concat.mp3`);
            const voicePath = path.join(tempDir, `readout_${timestamp}.ogg`);

            // TTS each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunkPath = path.join(tempDir, `readout_${timestamp}_chunk_${i}.mp3`);
                await downloadTTSChunk(chunks[i], chunkPath);
                chunkFiles.push(chunkPath);
            }

            // Concat + Convert
            await concatenateMP3s(chunkFiles, concatPath);
            await convertToVoiceNote(concatPath, voicePath);

            // Send voice note
            if (fs.existsSync(voicePath) && fs.statSync(voicePath).size > 0) {
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(voicePath),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true
                }, { quoted: m });
            } else {
                throw new Error('Final voice note file is empty');
            }

            // Cleanup
            if (fs.existsSync(concatPath)) fs.unlinkSync(concatPath);
            if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
            for (const f of chunkFiles) {
                if (fs.existsSync(f)) fs.unlinkSync(f);
            }

        } catch (e) {
            console.error('[READOUT ERROR]', e.message);
            reply('✘ ֎ Voice generation failed');
        }
    }
};