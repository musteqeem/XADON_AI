/**
 * Shared runtime for small, dependency-light command packs.
 *
 * Commands using this runtime stay tiny, but the actual behavior is kept here
 * in readable helpers so validation, replies and errors are consistent.
 */

const crypto = require('crypto');
const { URL } = require('url');
const chatbot = require('../Commands/Core/❚.js');

const MAX_REPLY = 60000;

function reply(sock, m, text) {
    return sock.sendMessage(
        m.chat,
        { text: String(text ?? '').slice(0, MAX_REPLY) },
        { quoted: m }
    );
}

function inputText(args = [], m = {}) {
    const fromArgs = Array.isArray(args) ? args.join(' ').trim() : '';
    if (fromArgs) return fromArgs;
    return String(m?.quoted?.text || '').trim();
}

function safeCalculate(expression) {
    const input = String(expression || '').trim();

    if (!input || !/^[0-9+\-*/%().,\s]+$/.test(input)) {
        throw new Error('Only numbers and arithmetic operators are allowed.');
    }

    // No identifiers, property access or function calls can pass the allowlist.
    const value = Function(`"use strict"; return (${input.replace(/,/g, '.')});`)();

    if (!Number.isFinite(value)) {
        throw new Error('The result is not a finite number.');
    }

    return value;
}

function slugify(text) {
    return String(text)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/&/g, ' and ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

function parseBinary(value) {
    const input = String(value).trim();
    if (!/^(?:[01]{1,8})(?:\s+[01]{1,8})*$/.test(input)) {
        throw new Error('Use binary bytes separated by spaces, e.g. 01001000 01101001.');
    }

    return Buffer.from(
        input.split(/\s+/).map(bits => Number.parseInt(bits, 2))
    ).toString('utf8');
}

function parseHex(value) {
    const input = String(value).replace(/\s+/g, '').trim();
    if (!/^(?:[0-9a-f]{2})+$/i.test(input)) {
        throw new Error('Use an even number of hexadecimal characters.');
    }
    return Buffer.from(input, 'hex').toString('utf8');
}

async function utility(sock, m, args, action) {
    const text = inputText(args, m);
    const noInput = ['date', 'time', 'timestamp', 'random', 'uuid'].includes(action);

    if (!text && !noInput) {
        return reply(sock, m, '❌ Provide an input value or reply to a message.');
    }

    try {
        let result;

        switch (action) {
            case 'upper':
                result = text.toUpperCase();
                break;
            case 'lower':
                result = text.toLowerCase();
                break;
            case 'title':
                result = text
                    .toLowerCase()
                    .replace(/\b[\p{L}\p{N}]/gu, char => char.toUpperCase());
                break;
            case 'reverse':
                result = [...text].reverse().join('');
                break;
            case 'length':
                result = [
                    `Characters: ${[...text].length}`,
                    `Words: ${text.trim() ? text.trim().split(/\s+/).length : 0}`,
                    `Bytes: ${Buffer.byteLength(text, 'utf8')}`
                ].join('\n');
                break;
            case 'words':
                result = String(text.trim() ? text.trim().split(/\s+/).length : 0);
                break;
            case 'lines':
                result = String(text ? text.split(/\r?\n/).length : 0);
                break;
            case 'trim':
                result = text.replace(/\s+/g, ' ').trim();
                break;
            case 'slug':
                result = slugify(text);
                break;
            case 'base64': {
                // Explicit modes avoid the old bug where ordinary text was
                // accidentally decoded as Base64 first.
                const mode = String(args?.[0] || '').toLowerCase();
                if (mode === 'decode' || mode === 'd') {
                    const encoded = args.slice(1).join(' ').trim() || text;
                    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) {
                        throw new Error('Invalid Base64 input.');
                    }
                    result = Buffer.from(encoded, 'base64').toString('utf8');
                } else {
                    result = Buffer.from(text, 'utf8').toString('base64');
                }
                break;
            }
            case 'urlencode':
                result = encodeURIComponent(text);
                break;
            case 'urldecode':
                result = decodeURIComponent(text);
                break;
            case 'json': {
                const parsed = JSON.parse(text);
                const compact = args?.[0] === 'min' || args?.[0] === 'compact';
                result = JSON.stringify(parsed, null, compact ? 0 : 2);
                break;
            }
            case 'hex':
                result = Buffer.from(text, 'utf8').toString('hex');
                break;
            case 'unhex':
                result = parseHex(text);
                break;
            case 'binary':
                result = [...Buffer.from(text, 'utf8')]
                    .map(byte => byte.toString(2).padStart(8, '0'))
                    .join(' ');
                break;
            case 'unbinary':
                result = parseBinary(text);
                break;
            case 'repeat': {
                const count = Math.min(50, Math.max(1, Number.parseInt(args?.[0], 10) || 1));
                const value = args.slice(1).join(' ') || m?.quoted?.text || '';
                if (!value) throw new Error('Provide text after the repeat count.');
                result = Array(count).fill(value).join('\n');
                break;
            }
            case 'sort':
                result = text.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join('\n');
                break;
            case 'unique':
                result = [...new Set(text.split(/\r?\n/))].join('\n');
                break;
            case 'date':
                result = new Date().toLocaleDateString('en-GB', { dateStyle: 'full' });
                break;
            case 'time':
                result = new Date().toLocaleTimeString('en-GB', { timeStyle: 'long' });
                break;
            case 'timestamp':
                result = String(Math.floor(Date.now() / 1000));
                break;
            case 'calc':
                result = String(safeCalculate(text));
                break;
            case 'random':
                result = String(crypto.randomInt(0, 1000000));
                break;
            case 'uuid':
                result = crypto.randomUUID();
                break;
            case 'regex': {
                const [pattern, flags, ...rest] = args || [];
                if (!pattern) throw new Error('Usage: .regex <pattern> [flags] <text>');
                const target = rest.join(' ');
                result = String(new RegExp(pattern, flags || '').test(target));
                break;
            }
            case 'urlcheck': {
                const url = new URL(text);
                result = [
                    `URL: ${url.href}`,
                    `Protocol: ${url.protocol}`,
                    `Host: ${url.host}`,
                    `Path: ${url.pathname}`,
                    `Query: ${url.search || '—'}`
                ].join('\n');
                break;
            }
            case 'hash':
                result = crypto.createHash('sha256').update(text, 'utf8').digest('hex');
                break;
            default:
                result = text;
        }

        if (!result && action === 'slug') {
            throw new Error('No usable characters were found for the slug.');
        }

        return reply(sock, m, result);
    } catch (error) {
        return reply(sock, m, `❌ ${error.message}`);
    }
}

async function ai(sock, m, args, prompt) {
    const text = inputText(args, m);
    if (!text) return reply(sock, m, '❌ Provide a prompt or reply to a message.');

    try {
        const result = await chatbot.askAI(`${prompt}\n\nUser input:\n${text}`, m.chat);
        return reply(sock, m, result || '⚠️ The AI returned an empty response.');
    } catch (error) {
        console.error('[COMMAND AI ERROR]', error);
        return reply(sock, m, '⚠️ AI service is temporarily unavailable. Please try again.');
    }
}

async function download(sock, m, args, provider, mode) {
    const url = inputText(args, m);
    if (!/^https?:\/\//i.test(url)) {
        return reply(sock, m, '❌ Provide a valid http(s) URL.');
    }

    try {
        const endpoint = `https://apis.prexzyvilla.site/download/${encodeURIComponent(provider)}?url=${encodeURIComponent(url)}`;
        const response = await fetch(endpoint, {
            headers: { 'User-Agent': 'XADON-AI/3.0' },
            timeout: 30000
        });

        if (!response.ok) throw new Error(`Download API returned HTTP ${response.status}.`);

        const data = await response.json();
        const item = data?.result || data;
        const media = item?.download || item?.url || item?.video || item?.audio || item?.image;

        if (mode === 'info' || !media) {
            return reply(sock, m, JSON.stringify(item, null, 2).slice(0, 12000));
        }

        const type = mode === 'audio' ? 'audio' : mode === 'image' ? 'image' : 'video';
        return sock.sendMessage(
            m.chat,
            {
                [type]: { url: media },
                caption: String(item?.title || `${provider} media`).slice(0, 1024)
            },
            { quoted: m }
        );
    } catch (error) {
        console.error(`[${provider} DOWNLOAD ERROR]`, error);
        return reply(sock, m, `❌ ${provider} download failed: ${error.message}`);
    }
}

async function group(sock, m, args, action, ctx) {
    if (!m.isGroup) return reply(sock, m, '❌ This command can only be used in a group.');

    const meta = ctx.groupMeta || await sock.groupMetadata(m.chat).catch(() => null);
    if (!meta) return reply(sock, m, '❌ Group metadata is unavailable.');

    const participants = meta.participants || [];
    const mentions = participants.map(user => user.id).filter(Boolean);

    switch (action) {
        case 'count':
            return reply(sock, m, `👥 Members: ${participants.length}`);
        case 'subject':
            return reply(sock, m, `🏷️ Subject: ${meta.subject || 'Unknown'}`);
        case 'description':
            return reply(sock, m, `📝 Description: ${meta.desc || 'No description'}`);
        case 'members':
            return reply(sock, m, participants.map((user, i) => `${i + 1}. ${user.id}`).join('\n'));
        case 'admins': {
            const admins = participants.filter(user => user.admin);
            return reply(sock, m, admins.length
                ? `👑 Admins (${admins.length})\n\n${admins.map((user, i) => `${i + 1}. @${user.id.split('@')[0]}`).join('\n')}`
                : '👑 No admins found.');
        }
        case 'mentions':
        case 'tagall':
        case 'hidetag':
            return sock.sendMessage(
                m.chat,
                { text: args.join(' ') || '📢 Group announcement', mentions },
                { quoted: m }
            );
        case 'lock':
        case 'announce':
            await sock.groupSettingUpdate(m.chat, 'announcement');
            return reply(sock, m, '🔒 Group is now admin-only for messages.');
        case 'unlock':
        case 'unmute':
            await sock.groupSettingUpdate(m.chat, 'not_announcement');
            return reply(sock, m, '🔓 Group members can send messages again.');
        default:
            return reply(sock, m, JSON.stringify({
                id: meta.id,
                subject: meta.subject,
                owner: meta.owner,
                size: participants.length
            }, null, 2));
    }
}

function execute(spec = {}) {
    return (sock, m, ctx = {}) => {
        switch (spec.kind) {
            case 'ai':
                return ai(sock, m, ctx.args, spec.prompt || 'Answer helpfully and accurately.');
            case 'download':
                return download(sock, m, ctx.args, spec.provider || 'media', spec.mode);
            case 'group':
                return group(sock, m, ctx.args, spec.action, ctx);
            case 'utility':
            default:
                return utility(sock, m, ctx.args, spec.action);
        }
    };
}

module.exports = {
    execute,
    inputText,
    slugify,
    safeCalculate
};
