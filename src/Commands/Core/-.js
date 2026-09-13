/**
 * Shared bot identity and optional AI bridge.
 * This file is intentionally not a command; it is imported by other modules.
 */

const axios = require('axios');

function getOwnerNumber() {
    return String(process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
}

const ownerInfo = {
    name: process.env.OWNER_NAME || 'Bot Owner',
    displayName: process.env.OWNER_DISPLAY_NAME || process.env.OWNER_NAME || 'Bot Owner',
    get number() {
        return getOwnerNumber();
    },
    role: process.env.OWNER_ROLE || 'Bot Developer',
    established: process.env.BOT_ESTABLISHED || '2025',
    github: process.env.OWNER_GITHUB || '',
    youtube: process.env.OWNER_YOUTUBE || '',
    tiktok: process.env.OWNER_TIKTOK || '',
    location: process.env.OWNER_LOCATION || ''
};

/**
 * Optional OpenAI-compatible AI endpoint. Configure AI_API_URL, AI_API_KEY
 * and AI_MODEL in .env. If they are missing, callers get a clear error rather
 * than a fake provider URL.
 */
async function getLunaResponse(prompt) {
    const url = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL;

    if (!url || !apiKey || !model) {
        throw new Error('AI_API_URL, AI_API_KEY and AI_MODEL are not configured.');
    }

    const response = await axios.post(
        url,
        {
            model,
            messages: [{ role: 'user', content: String(prompt || '') }],
            temperature: 0.7,
            max_tokens: 1000
        },
        {
            timeout: 30000,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data?.choices?.[0]?.message?.content?.trim() || '';
}

module.exports = {
    ownerInfo,
    getLunaResponse,
    getOwnerNumber
};
