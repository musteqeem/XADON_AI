const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const axios = require('axios');

const POPULAR_COINS = ['bitcoin', 'ethereum', 'bnb', 'solana', 'ripple', 'cardano', 'dogecoin', 'tron'];

module.exports = {
    name: 'crypto',
    alias: ['coin', 'price', 'cryptoprice'],
    desc: 'Get live cryptocurrency prices',
    category: 'Search',
    usage: '.crypto <coin> |.crypto top',
    reactions: { start: '🪙', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const query = args.join(' ').toLowerCase().trim();

        if (!query) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} CRYPTO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ Command : ${prefix}crypto <coin>
│ ❏ Command : ${prefix}crypto top
╰─────────────────────────╯
╭─֎ *EXAMPLES*
│ ❏ ${prefix}crypto bitcoin
│ ❏ ${prefix}crypto eth
│ ❏ ${prefix}crypto bnb
│ ❏ ${prefix}crypto top
╰─────────────────────────╯
_*🪙 Live prices powered by CoinGecko*_`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '🪙', key: m.key } });

        try {
            // ── TOP COINS ──────────────────────────────────────────
            if (query === 'top') {
                const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
                    params: {
                        vs_currency: 'usd',
                        order: 'market_cap_desc',
                        per_page: 10,
                        page: 1,
                        sparkline: false
                    },
                    timeout: 10000,
                    headers: { 'Accept': 'application/json' }
                });

                let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n *֎ • ${BOT_NAME} TOP 10 CRYPTO*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *BY MARKET CAP USD*\n`;

                res.data.forEach((coin, i) => {
                    const change = coin.price_change_percentage_24h?.toFixed(2) || '0';
                    const changeEmoji = change >= 0? '🟢' : '🔴';
                    const price = coin.current_price < 1? `$${coin.current_price.toFixed(6)}` : `$${coin.current_price.toLocaleString()}`;
                    text += `│ ❏ #${coin.market_cap_rank} ${coin.symbol.toUpperCase()} : ${price} ${changeEmoji}${change}%\n`;
                });

                text += `╰─────────────────────────╯\n\n_*💡 Use ${prefix}crypto <coin> for details*_`;

                await sock.sendMessage(m.chat, { text }, { quoted: m });
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
                return;
            }

            // ── SINGLE COIN ───────────────────────────────────────
            const coinMap = {
                'btc': 'bitcoin', 'eth': 'ethereum', 'sol': 'solana', 'xrp': 'ripple',
                'ada': 'cardano', 'doge': 'dogecoin', 'trx': 'tron', 'dot': 'polkadot',
                'matic': 'polygon', 'shib': 'shiba-inu', 'avax': 'avalanche-2',
                'link': 'chainlink', 'uni': 'uniswap', 'ltc': 'litecoin', 'bnb': 'binancecoin'
            };

            const coinId = coinMap[query] || query;

            const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
                params: {
                    vs_currency: 'usd',
                    ids: coinId,
                    order: 'market_cap_desc',
                    sparkline: false
                },
                timeout: 10000,
                headers: { 'Accept': 'application/json' }
            });

            if (!res.data.length) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(`_*❌ Coin not found: "${query}"*_`);
            }

            const coin = res.data[0];
            const change = coin.price_change_percentage_24h?.toFixed(2) || '0';
            const changeEmoji = change >= 0? '🟢' : '🔴';
            const price = coin.current_price < 1? `$${coin.current_price.toFixed(6)}` : `$${coin.current_price.toLocaleString()}`;

            await sock.sendMessage(m.chat, {
                text:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} CRYPTO*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *${coin.name} (${coin.symbol.toUpperCase()})*
│ ❏ Price : ${price}
│ ❏ 24h Change : ${changeEmoji} ${change}%
│ ❏ Market Rank : #${coin.market_cap_rank}
│ ❏ Market Cap : $${coin.market_cap?.toLocaleString() || 'N/A'}
│ ❏ 24h High : $${coin.high_24h?.toLocaleString() || 'N/A'}
│ ❏ 24h Low : $${coin.low_24h?.toLocaleString() || 'N/A'}
│ ❏ Volume : $${coin.total_volume?.toLocaleString() || 'N/A'}
│ ❏ Updated : ${new Date(coin.last_updated).toLocaleString()}
╰─────────────────────────╯

_*📊 Live data from CoinGecko*_`
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error('[CRYPTO ERROR]', error.message);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to fetch prices. API may be rate limited. Try again*_');
        }
    }
};