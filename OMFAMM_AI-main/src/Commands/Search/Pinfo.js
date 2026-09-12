const { fetchJson } = require('../_helpers');

let countryCache = null;
let countryCacheAt = 0;

module.exports = {
    name: 'phoneinfo',
    alias: ['phone', 'numberinfo', 'numinfo'],
    desc: 'Inspect a phone number and resolve its country calling code',
    category: 'Search',
    usage: '.phoneinfo <number with country code>',
    reactions: { start: '📞', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        const raw = args.join('').trim();
        const number = raw.replace(/[^0-9]/g, '');

        if (!/^\d{7,15}$/.test(number)) {
            return reply('📞 Provide a valid international number with country code.\nExample: .phoneinfo 2348012345678');
        }

        try {
            const country = await resolveCountry(number);
            const digits = country?.dialCode ? number.slice(String(country.dialCode).length) : number;

            return reply(
                `📞 *PHONE INFO*\n\n` +
                `Number       : +${number}\n` +
                `Country      : ${country?.name || 'Unknown'}\n` +
                `Country code : ${country?.dialCode ? `+${country.dialCode}` : 'Unknown'}\n` +
                `Local digits : ${digits}\n` +
                `Length       : ${number.length} digits\n\n` +
                `_This command validates the number format and country prefix; it does not expose private subscriber data._`
            );
        } catch (error) {
            console.error('[PHONE INFO ERROR]', error);
            return reply('❌ Phone information service is temporarily unavailable.');
        }
    }
};

async function resolveCountry(number) {
    const now = Date.now();
    if (!countryCache || now - countryCacheAt > 24 * 60 * 60 * 1000) {
        const data = await fetchJson(
            'https://restcountries.com/v3.1/all?fields=name,idd',
            {},
            15000
        );
        countryCache = Array.isArray(data) ? data : [];
        countryCacheAt = now;
    }

    const candidates = [];
    for (const country of countryCache) {
        const root = country?.idd?.root;
        const suffixes = country?.idd?.suffixes;
        if (!root) continue;

        if (Array.isArray(suffixes) && suffixes.length) {
            for (const suffix of suffixes) candidates.push({
                name: country?.name?.common || 'Unknown',
                dialCode: `${root.replace('+', '')}${String(suffix).replace('+', '')}`
            });
        } else {
            candidates.push({
                name: country?.name?.common || 'Unknown',
                dialCode: root.replace('+', '')
            });
        }
    }

    candidates.sort((a, b) => b.dialCode.length - a.dialCode.length);
    return candidates.find(item => number.startsWith(item.dialCode)) || null;
}
