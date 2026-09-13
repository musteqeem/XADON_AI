const crypto = require('crypto');

const inputText = (args = [], m = {}) =>
  args.join(' ').trim() || String(m?.quoted?.text || '').trim();

const normalizeJid = jid => String(jid || '').replace(/:\d+(?=@)/, '');

const unique = items => [...new Set((items || []).filter(Boolean))];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'User-Agent': 'MUSTEQEEM-AI/3.0',
        Accept: 'application/json',
        ...(options.headers || {})
      }
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function commandInfo({ name, alias = [], category, desc, usage, execute, ...flags }) {
  return {
    name,
    alias,
    category,
    desc: desc || `${name} command`,
    usage: usage || `.${name}`,
    ...flags,
    execute
  };
}

function getTargets(m, args = []) {
  const targets = [];
  if (m?.quoted?.sender) targets.push(m.quoted.sender);
  for (const jid of m?.mentionedJid || []) targets.push(jid);
  for (const arg of args) {
    const digits = String(arg).replace(/\D/g, '');
    if (digits.length >= 7) targets.push(`${digits}@s.whatsapp.net`);
  }
  return unique(targets.map(normalizeJid));
}

function formatJid(jid) {
  return `@${normalizeJid(jid).split('@')[0]}`;
}

function safeJson(value, max = 12000) {
  const out = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return out.length > max ? `${out.slice(0, max - 20)}\n…truncated` : out;
}

function hash(text, algorithm = 'sha256') {
  return crypto.createHash(algorithm).update(text).digest('hex');
}

module.exports = {
  inputText, normalizeJid, unique, sleep, fetchJson, commandInfo,
  getTargets, formatJid, safeJson, hash
};
