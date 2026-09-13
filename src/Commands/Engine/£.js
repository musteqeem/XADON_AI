const util = require('util');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

module.exports = {
    name: 'eval',
    alias: ['#', '>', 'sh'],
    desc: 'Execute JavaScript code or shell commands',
    category: 'Owner',
    ownerOnly: true,

    execute: async (sock, m, { args, reply, text, prefix, command, isOwner, isDual }) => {
        if (!text) return reply('✦ Usage: `> code` or `sh command`');

        const startTime = Date.now();
        const isShell = command === 'sh';

        const box = (title, content) => {
            const line = '─'.repeat(Math.min(title.length + 2, 40));
            return `┌➫─⏚ ${title} ${line}\n${content}\n└${'─'.repeat(42)}`;
        };

        // ── Shell execution mode ──
        if (isShell) {
            try {
                const result = execSync(text, {
                    encoding: 'utf8',
                    timeout: 30000,
                    maxBuffer: 1024 * 1024 * 5
                });
                const timeTaken = Date.now() - startTime;
                const output = (result || 'No output').slice(0, 4000);
                return reply(box(`⚡ SHELL ${(timeTaken)}ms`, `\`\`\`\n${output}\n\`\``));
            } catch (err) {
                const timeTaken = Date.now() - startTime;
                const errOutput = (err.stdout || err.stderr || err.message).slice(0, 4000);
                return reply(box(`✘ SHELL ERROR ${(timeTaken)}ms`, `\`\`\`\n${errOutput}\n\`\`\``));
            }
        }

        // ── JavaScript execution mode ──
        let consoleOutput = '';
        const originalLog   = console.log;
        const originalError = console.error;
        const originalWarn  = console.warn;

        const capture = (prefix) => (...args) => {
            consoleOutput += prefix + args.map(a =>
                typeof a === 'object' ? util.inspect(a, { depth: 3, colors: false }) : String(a)
            ).join(' ') + '\n';
        };

        console.log   = capture('📝 ');
        console.error = capture('❌ ');
        console.warn  = capture('⚠️ ');

        try {
            // ── Core Media Helpers ──
            const sendImage = (source, caption = '') => {
                const content = typeof source === 'string' && source.startsWith('http')
                    ? { url: source }
                    : Buffer.isBuffer(source) ? source : fs.readFileSync(source);
                return sock.sendMessage(m.chat, { image: content, caption }, { quoted: m });
            };

            const sendVideo = (source, caption = '') => {
                const content = typeof source === 'string' && source.startsWith('http')
                    ? { url: source }
                    : Buffer.isBuffer(source) ? source : fs.readFileSync(source);
                return sock.sendMessage(m.chat, { video: content, caption }, { quoted: m });
            };

            const sendAudio = (source, ptt = false) => {
                const content = typeof source === 'string' && source.startsWith('http')
                    ? { url: source }
                    : Buffer.isBuffer(source) ? source : fs.readFileSync(source);
                return sock.sendMessage(m.chat, { audio: content, ptt }, { quoted: m });
            };

            const sendFile = (source, filename = 'file') => {
                const content = typeof source === 'string' && source.startsWith('http')
                    ? { url: source }
                    : Buffer.isBuffer(source) ? source : fs.readFileSync(source);
                return sock.sendMessage(m.chat, { document: content, fileName: filename }, { quoted: m });
            };

            // ── NEW PRO HELPERS ──
            const sendSticker = (source) => {
                const content = typeof source === 'string' && source.startsWith('http')
                    ? { url: source }
                    : Buffer.isBuffer(source) ? source : fs.readFileSync(source);
                return sock.sendMessage(m.chat, { sticker: content }, { quoted: m });
            };

            const sendContact = (name, number) => {
                return sock.sendMessage(m.chat, {
                    contacts: {
                        displayName: name,
                        contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;type=CELL;type=VOICE;waid=${number}:${number}\nEND:VCARD` }]
                    }
                }, { quoted: m });
            };

            const sendLocation = (lat, lng, name = 'Location') => {
                return sock.sendMessage(m.chat, { location: { degreesLatitude: lat, degreesLongitude: lng, name } }, { quoted: m });
            };

            const sendButtons = (text, buttons = []) => {
                return sock.sendMessage(m.chat, {
                    text,
                    footer: 'Pro Eval',
                    buttons: buttons.map((b, i) => ({ buttonId: `btn_${i}`, buttonText: { displayText: b }, type: 1 })),
                    headerType: 1
                }, { quoted: m });
            };

            const sendList = (text, sections = []) => {
                return sock.sendMessage(m.chat, {
                    text,
                    footer: 'Pro Eval',
                    title: 'Select',
                    buttonText: 'Open',
                    sections
                }, { quoted: m });
            };

            const sendText = (txt) => sock.sendMessage(m.chat, { text: txt }, { quoted: m });

            // ── Utility Helpers ──
            const shell = (cmd) => new Promise((resolve, reject) => {
                exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
                    if (err) reject(stderr || err.message);
                    else resolve(stdout);
                });
            });

            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            const fetch = async (url, options = {}) => {
                const res = await (global.fetch || require('node-fetch'))(url, options);
                return res;
            };

            const json = (obj) => JSON.stringify(obj, null, 2);

            const table = (data) => {
                if (!Array.isArray(data) || data.length === 0) return '[]';
                const keys = Object.keys(data[0]);
                const rows = data.map(obj => keys.map(k => String(obj[k] ?? '')));
                const colWidths = keys.map((k, i) => Math.max(k.length, ...rows.map(r => r[i].length)));
                const sep = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
                const formatRow = (row) => '| ' + row.map((c, i) => c.padEnd(colWidths[i])).join(' | ') + ' |';
                return [sep, formatRow(keys), sep, ...rows.map(formatRow), sep].join('\n');
            };

            const inspect = (obj, depth = 4) => util.inspect(obj, { depth, colors: false });

            const readFile = (p) => fs.readFileSync(p, 'utf8');
            const writeFile = (p, d) => fs.writeFileSync(p, d);
            const copy = (txt) => writeFile('./clipboard.txt', txt);

            const ping = () => sock.ws?.ping || 'N/A';
            const mem = () => {
                const u = process.memoryUsage();
                return `RSS: ${(u.rss/1024/1024).toFixed(2)}MB | Heap: ${(u.heapUsed/1024/1024).toFixed(2)}MB`;
            };
            const uptime = () => {
                const s = process.uptime();
                const h = Math.floor(s/3600), m = Math.floor(s%3600/60), sec = Math.floor(s%60);
                return `${h}h ${m}m ${sec}s`;
            };

            // Smart wrap
            const isMultiLine = text.includes('\n');
            const hasDeclaration = /^\s*(const|let|var|function|class|if|for|while|try|switch)/m.test(text);
            let wrappedCode = (isMultiLine || hasDeclaration) 
                ? `(async () => { ${text} })()` 
                : `(async () => { return ${text} })()`;

            let result = await eval(wrappedCode);

            console.log   = originalLog;
            console.error = originalError;
            console.warn  = originalWarn;

            const timeTaken = Date.now() - startTime;

            // ── SMART FILTER ──
            function isWhatsAppSendResponse(result) {
                if (!result) return false;
                if (result.message?.reactionMessage) return true;
                if (result.key && result.messageTimestamp && !result.conversation && !result.text) return true;
                return false;
            }

            const wantsRaw = text.includes('.raw') || text.includes('//raw');
            let output = '';
            if (consoleOutput) output += consoleOutput.trimEnd();

            const isSendResponse = !wantsRaw && isWhatsAppSendResponse(result);

            if (isSendResponse) {
                if (!consoleOutput) return;
            } else if (result !== undefined) {
                let resultStr;
                if (Buffer.isBuffer(result)) {
                    resultStr = `<Buffer ${result.length} bytes>`;
                } else if (typeof result === 'function') {
                    resultStr = `[Function: ${result.name || 'anonymous'}]`;
                } else if (typeof result === 'object') {
                    resultStr = util.inspect(result, { 
                        depth: wantsRaw ? 5 : 3, 
                        colors: false, 
                        maxArrayLength: wantsRaw ? 50 : 20,
                        breakLength: wantsRaw ? 80 : 60
                    });
                    if (resultStr.length > 8000) resultStr = resultStr.slice(0, 8000) + '\n... (truncated)';
                } else {
                    resultStr = String(result);
                }
                output = output ? output + '\n' + resultStr : resultStr;
            }

            if (output && output.trim() && output.trim() !== 'undefined') {
                // pagination for long output
                const chunks = output.match(/[\s\S]{1,3900}/g) || [output];
                for (let i = 0; i < chunks.length; i++) {
                    const header = chunks.length > 1 ? `✦ RESULT ${i+1}/${chunks.length} ${(timeTaken)}ms` : `✦ RESULT ${(timeTaken)}ms`;
                    await reply(box(header, `\`\`\`\n${chunks[i]}\n\`\`\``));
                    if (i < chunks.length - 1) await sleep(500);
                }
            } else if (!consoleOutput && (result === undefined || isSendResponse)) {
                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } }).catch(() => {});
            }

        } catch (err) {
            console.log   = originalLog;
            console.error = originalError;
            console.warn  = originalWarn;

            const timeTaken = Date.now() - startTime;
            let errMsg = err.stack || err.message || String(err);
            if (consoleOutput) errMsg = consoleOutput.trimEnd() + '\n' + errMsg;

            reply(box(`✘ ERROR ${(timeTaken)}ms`, `\`\n${errMsg.slice(0, 4000)}\n\`\`\``));
        }
    }
};