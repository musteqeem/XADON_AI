/**
 * Groq client factory used by optional commands.
 * API keys are read from environment variables and never stored in source.
 *
 * Supported configuration:
 *   GROQ_API_KEY=...
 *   GROQ_API_KEYS=key1,key2,key3
 */

const { Groq } = require('groq-sdk');

let currentKeyIndex = 0;

function getKeys() {
    const keys = [
        process.env.GROQ_API_KEY,
        ...(process.env.GROQ_API_KEYS || '').split(',')
    ]
        .map(value => String(value || '').trim())
        .filter(Boolean);

    return [...new Set(keys)];
}

function getGroqClient() {
    const keys = getKeys();
    if (!keys.length) {
        throw new Error('GROQ_API_KEY or GROQ_API_KEYS is not configured.');
    }

    currentKeyIndex %= keys.length;
    return new Groq({ apiKey: keys[currentKeyIndex] });
}

function rotateKey() {
    const keys = getKeys();
    if (keys.length > 1) currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return getGroqClient();
}

module.exports = {
    get groq() {
        return getGroqClient();
    },
    getGroqClient,
    rotateKey,
    get GROQ_KEYS() {
        return getKeys();
    }
};
