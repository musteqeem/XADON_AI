/**
 * Shared audio-effect engine.
 * Downloads the replied audio/voice note, runs one FFmpeg filter and sends
 * the result back as an Opus voice note.
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const TEMP_DIR = path.join(__dirname, '../../../temp/audio-effects');
const MAX_AGE_MS = 10 * 60 * 1000;

function ensureTempDir() {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function cleanupTempFiles() {
    ensureTempDir();
    const now = Date.now();

    for (const file of fs.readdirSync(TEMP_DIR)) {
        const fullPath = path.join(TEMP_DIR, file);
        try {
            if (now - fs.statSync(fullPath).mtimeMs > MAX_AGE_MS) {
                fs.unlinkSync(fullPath);
            }
        } catch {}
    }
}

async function getAudioBuffer(m) {
    if (m?.quoted?.download) return m.quoted.download();
    if (m?.download && /audio|voice/i.test(String(m.mtype || ''))) return m.download();
    return null;
}

async function convertAudio(sock, m, audioFilter, options = {}) {
    ensureTempDir();
    cleanupTempFiles();

    const buffer = await getAudioBuffer(m);
    if (!buffer) {
        await sock.sendMessage(
            m.chat,
            { text: '🎧 Reply to an audio or voice note with this command.' },
            { quoted: m }
        );
        return false;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const input = path.join(TEMP_DIR, `${id}.input`);
    const output = path.join(TEMP_DIR, `${id}.ogg`);

    try {
        fs.writeFileSync(input, buffer);

        await new Promise((resolve, reject) => {
            ffmpeg(input)
                .audioFilters(audioFilter)
                .audioCodec('libopus')
                .audioBitrate(options.bitrate || '128k')
                .format('ogg')
                .on('end', resolve)
                .on('error', reject)
                .save(output);
        });

        if (!fs.existsSync(output) || fs.statSync(output).size === 0) {
            throw new Error('FFmpeg produced an empty audio file.');
        }

        await sock.sendMessage(
            m.chat,
            {
                audio: fs.readFileSync(output),
                mimetype: 'audio/ogg; codecs=opus',
                ptt: options.ptt !== false
            },
            { quoted: m }
        );

        return true;
    } catch (error) {
        console.error('[AUDIO EFFECT ERROR]', error);
        await sock.sendMessage(
            m.chat,
            { text: `❌ Audio conversion failed: ${error.message}` },
            { quoted: m }
        ).catch(() => {});
        return false;
    } finally {
        for (const file of [input, output]) {
            try {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch {}
        }
    }
}

module.exports = {
    convertAudio,
    cleanupTempFiles
};
