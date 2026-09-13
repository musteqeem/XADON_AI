const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    name: 'web',
    alias: ['search', 'google', 'lookup', 'find'],
    category: 'tools',
    owner: [],
    desc: 'Smart web search with AI query detection',
    reactions: {
        start: '🔎',
        success: '💬'
    },
    execute: async (conn, m, { args, reply, prefix }) => {
        if (!args.length) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *AI WEB SEARCH*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE GUIDE*
│ ❏ Command : ${prefix}web <query>
│ ❏ Example : ${prefix}web Donald Trump
│ ❏ Example : ${prefix}web life pictures of antelopes in Australia
│ ❏ Example : ${prefix}web latest iPhone price
│ ❏ Example : ${prefix}web weather in Tokyo
╰─────────────────────────╯
*Smart Detection:*
* Image → Auto-fetches image results
* News → Gets latest articles
* Weather → Live weather data
* Price/Product → Shopping results
* Person → Knowledge panel
* General → Best match results`
        );

        const query = args.join(' ');
        const cleanQuery = query.toLowerCase();

        await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        try {
            const intent = detectIntent(cleanQuery);
            let results;

            switch (intent) {
                case 'image':
                    results = await searchImages(query);
                    break;
                case 'news':
                    results = await searchNews(query);
                    break;
                case 'weather':
                    results = await searchWeather(query);
                    break;
                case 'definition':
                    results = await searchDefinition(query);
                    break;
                case 'product':
                case 'price':
                    results = await searchProduct(query);
                    break;
                case 'person':
                    results = await searchPerson(query);
                    break;
                case 'location':
                    results = await searchLocation(query);
                    break;
                default:
                    results = await searchGeneral(query);
            }
            await sendResults(conn, m, query, results, intent);
        } catch (err) {
            console.error('[AI WEB SEARCH ERROR]', err);
            await reply(`✗ Error: ${err.message}\n\n*Contact:* <bot owner number>`);
        }
    }
};

// Detect user intent
function detectIntent(q) {
    if (/\b(pictures?|images?|photos?|pics?|wallpaper|gif|memes?)\b/.test(q)) return 'image';
    if (/\b(news|latest|update|breaking|headlines?|today|current)\b/.test(q)) return 'news';
    if (/\b(weather|temperature|forecast|rain|sunny|climate)\b/.test(q)) return 'weather';
    if (/^(what is|who is|define|meaning of|wiki|wikipedia)\b/.test(q) || /\b(definition|meaning|wiki)\b/.test(q)) return 'definition';
    if (/\b(price|cost|buy|cheap|expensive|amazon|ebay|shop|product)\b/.test(q) || /\$\d|\bdollars?\b|\beuros?\b/.test(q)) return 'product';
    if (/\b(trump|biden|elon musk|celebrity|actor|president|ceo|founder)\b/.test(q) || /^who is\b/.test(q)) return 'person';
    if (/\b(in|at|near|location|city|country|place|map|directions?)\b/.test(q) && /\b(australia|usa|uk|japan|london|paris|tokyo|new york)\b/.test(q)) return 'location';
    return 'general';
}

// Image Search
async function searchImages(q) {
    try {
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        const images = [];
        $('.mimg').each((i, el) => {
            if (i >= 5) return false;
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && src.startsWith('http')) images.push(src);
        });
        if (images.length === 0) return { type: 'image', images: ['https://via.placeholder.com/400x300?text=No+Images+Found'], query: q };
        return { type: 'image', images, query: q };
    } catch {
        return { type: 'image', images: [], fallback: true, query: q };
    }
}

// News Search
async function searchNews(q) {
    try {
        const clean = q.replace(/\b(news|latest|current)\b/gi, '').trim();
        const url = `https://www.bing.com/news/search?q=${encodeURIComponent(clean)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        const articles = [];
        $('.news-card,.newsitem, [data-testid="news-headline"]').each((i, el) => {
            if (i >= 5) return false;
            const title = $(el).find('a').text().trim() || $(el).find('.title').text().trim();
            const link = $(el).find('a').attr('href');
            const snippet = $(el).find('.snippet,.description').text().trim();
            const source = $(el).find('.source,.provider').text().trim();
            if (title && link) articles.push({
                title: title.substring(0, 100),
                url: link.startsWith('http')? link : 'https://www.bing.com' + link,
                snippet: snippet?.substring(0, 150) || 'No description',
                source: source || 'News'
            });
        });
        return { type: 'news', articles, query: q };
    } catch (e) {
        return { type: 'news', articles: [], error: e.message, query: q };
    }
}

// Weather Search
async function searchWeather(q) {
    try {
        const location = q.replace(/\b(weather|temperature|forecast|in|at)\b/gi, '').trim();
        const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'curl' } });
        const current = data.current_condition[0];
        const area = data.nearest_area[0];
        return {
            type: 'weather',
            location: `${area.areaName[0].value}, ${area.country[0].value}`,
            temp: current.temp_C,
            feelsLike: current.FeelsLikeC,
            condition: current.weatherDesc[0].value,
            humidity: current.humidity,
            wind: current.windspeedKmph,
            visibility: current.visibility,
            query: q
        };
    } catch {
        return { type: 'weather', location: q.replace(/\b(weather|in)\b/gi, '').trim(), error: 'Weather data unavailable', query: q };
    }
}

// Definition Search
async function searchDefinition(q) {
    try {
        const term = q.replace(/\b(what is|who is|define|meaning of|wiki)\b/gi, '').trim();
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'AI/1.0' } });
        return {
            type: 'definition',
            title: data.title,
            extract: data.extract,
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${term}`,
            image: data.thumbnail?.source,
            query: q
        };
    } catch {
        try {
            const term = q.replace(/\b(what is|define|meaning of)\b/gi, '').trim();
            const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`;
            const { data } = await axios.get(url);
            const d = data[0];
            return {
                type: 'definition',
                title: d.word,
                extract: d.meanings[0]?.definitions[0]?.definition || 'No definition found',
                phonetic: d.phonetic,
                url: `https://en.wiktionary.org/wiki/${term}`,
                query: q
            };
        } catch {
            return { type: 'definition', title: q, extract: 'Definition not found. Try searching on Google.', url: `https://www.google.com/search?q=define+${encodeURIComponent(q)}`, query: q };
        }
    }
}

// Product Search
async function searchProduct(q) {
    try {
        const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        const products = [];
        $('.sh-dgr__grid-result,.pslires').each((i, el) => {
            if (i >= 5) return false;
            const title = $(el).find('h3').text().trim();
            const price = $(el).find('.a8Pemb,.e10twf').text().trim();
            const link = $(el).find('a').attr('href');
            if (title) products.push({
                title: title.substring(0, 80),
                price: price || 'Price not shown',
                url: link?.startsWith('http')? link : 'https://www.google.com' + link
            });
        });
        return { type: 'product', products, query: q };
    } catch {
        return { type: 'product', products: [], fallback: true, query: q };
    }
}

// Person Search
async function searchPerson(q) {
    const term = q.replace(/\b(who is)\b/gi, '').trim();
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'AI/1.0' } });
        if (data.type === 'standard' || data.type === 'disambiguation') {
            return {
                type: 'person',
                name: data.title,
                description: data.extract,
                image: data.thumbnail?.source,
                url: data.content_urls?.desktop?.page,
                isPerson: true,
                query: q
            };
        }
    } catch {}
    return await searchGeneral(q, true);
}

// Location Search
async function searchLocation(q) {
    try {
        const place = q.replace(/\b(location|map|in|at|near)\b/gi, '').trim();
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'AI/1.0' } });
        if (data && data.length > 0) {
            const p = data[0];
            return {
                type: 'location',
                name: p.display_name,
                lat: p.lat,
                lon: p.lon,
                type: p.type,
                importance: p.importance,
                mapUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=15/${p.lat}/${p.lon}`,
                query: q
            };
        }
        throw new Error('Location not found');
    } catch {
        return { type: 'location', name: q, error: 'Location details unavailable', mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(q)}`, query: q };
    }
}

// General Search
async function searchGeneral(q, isPerson = false) {
    try {
        const url = `https://html.duckgo.com/html/?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' } });
        const $ = cheerio.load(data);
        const results = [];
        $('.result').each((i, el) => {
            if (i >= 5) return false;
            const title = $(el).find('.result__a').text().trim();
            const link = $(el).find('.result__a').attr('href');
            const snippet = $(el).find('.result__snippet').text().trim();
            if (title) results.push({
                title: title.substring(0, 100),
                url: link?.startsWith('http')? link : 'https://duckgo.com' + link,
                snippet: snippet?.substring(0, 200) || 'No description available'
            });
        });
        return { type: isPerson? 'person' : 'general', results, query: q };
    } catch (e) {
        return { type: 'general', results: [], error: e.message, query: q, fallbackUrl: `https://www.google.com/search?q=${encodeURIComponent(q)}` };
    }
}

// Send Results
async function sendResults(conn, m, query, data, intent) {
    switch (data.type) {
        case 'image': return await sendImageResults(conn, m, data);
        case 'news': return await sendNewsResults(conn, m, data);
        case 'weather': return await sendWeatherResults(conn, m, data);
        case 'definition': return await sendDefinitionResults(conn, m, data);
        case 'product': return await sendProductResults(conn, m, data);
        case 'person': return await sendPersonResults(conn, m, data);
        case 'location': return await sendLocationResults(conn, m, data);
        default: return await sendGeneralResults(conn, m, data);
    }
}

async function sendImageResults(conn, m, data) {
    if (data.images && data.images.length > 0) {
        await conn.sendMessage(m.chat, {
            image: { url: data.images[0] },
            caption: `🖼️ *AI IMAGE SEARCH: ${data.query}*\n\nFound ${data.images.length} images\n\n_Powered by AI_`,
            contextInfo: { externalAdReply: { title: 'AI Image Search', body: data.query, thumbnailUrl: data.images[0], sourceUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(data.query)}`, mediaType: 1 } }
        }, { quoted: m });
        if (data.images.length > 1) {
            for (const img of data.images.slice(1, 4)) {
                await conn.sendMessage(m.chat, { image: { url: img }, caption: '' });
            }
        }
    } else {
        await reply(`🖼️ No images found for "${data.query}"\n\nTry: https://www.google.com/search?tbm=isch&q=${encodeURIComponent(data.query)}`);
    }
}

async function sendNewsResults(conn, m, data) {
    if (!data.articles || data.articles.length === 0) return reply(`📰 No news found for "${data.query}"`);
    let txt = `📰 *NEWS: ${data.query.toUpperCase()}*\n\n`;
    data.articles.forEach((a, i) => {
        txt += `${i + 1}. *${a.title}*\n 📝 ${a.snippet}\n 🔗 ${a.url}\n 📌 ${a.source}\n\n`;
    });
    txt += '_Powered by AI_';
    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: { externalAdReply: { title: 'AI News', body: `Latest: ${data.query}`, thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png', sourceUrl: `https://www.bing.com/news/search?q=${encodeURIComponent(data.query)}`, mediaType: 1 } }
    }, { quoted: m });
}

async function sendWeatherResults(conn, m, data) {
    if (data.error) return reply(`🌤️ Weather data unavailable for "${data.location}"\n\nTry again with a more specific query.`);
    const txt = `🌤️ *WEATHER: ${data.location}*\n\n🌡️ Temperature: ${data.temp}°C - ${data.condition}\n🤒 Feels Like: ${data.feelsLike}°C\n💧 Humidity: ${data.humidity}%\n🌬️ Wind: ${data.wind} km/h\n👁️ Visibility: ${data.visibility} km\n_Powered by AI_`;
    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: { externalAdReply: { title: `${data.temp}°C - ${data.condition}`, body: data.location, thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/869/869869.png', sourceUrl: `https://wttr.in/${encodeURIComponent(data.location)}`, mediaType: 1 } }
    }, { quoted: m });
}

async function sendDefinitionResults(conn, m, data) {
    let txt = `📚 *${data.title}*\n\n${data.extract}\n\n`;
    if (data.phonetic) txt += `🔊 Pronunciation: ${data.phonetic}\n`;
    txt += `🔗 More info: ${data.url}\n\n_Powered by AI_`;
    const msg = { text: txt, contextInfo: { externalAdReply: { title: data.title, body: 'Definition & Info', thumbnailUrl: data.image || 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png', sourceUrl: data.url, mediaType: 1 } } };
    if (data.image) msg.image = { url: data.image };
    await conn.sendMessage(m.chat, msg, { quoted: m });
}

async function sendProductResults(conn, m, data) {
    if (!data.products || data.products.length === 0) return reply(`🛒 No products found for "${data.query}"\n\nTry: https://www.google.com/search?tbm=shop&q=${encodeURIComponent(data.query)}`);
    let txt = `🛒 *SHOPPING: ${data.query.toUpperCase()}*\n\n`;
    data.products.forEach((p, i) => {
        txt += `${i + 1}. *${p.title}*\n 💰 ${p.price}\n 🔗 ${p.url}\n\n`;
    });
    txt += '_Powered by AI_';
    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: { externalAdReply: { title: 'AI Shopping', body: `Best prices for ${data.query}`, thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', sourceUrl: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(data.query)}`, mediaType: 1 } }
    }, { quoted: m });
}

async function sendPersonResults(conn, m, data) {
    let txt = `👤 *${data.name}*\n\n${data.description || data.extract?.[0]?.definition}\n\n`;
    if (data.url) txt += `🔗 More info: ${data.url}\n`;
    txt += '_Powered by AI_';
    const msg = { text: txt, contextInfo: { externalAdReply: { title: data.name, body: 'Biography & Info', thumbnailUrl: data.image || 'https://cdn-icons-png.flaticon.com/512/2965/2965278.png', sourceUrl: data.url || `https://www.google.com/search?q=${encodeURIComponent(data.name)}`, mediaType: 1 } } };
    if (data.image) msg.image = { url: data.image };
    await conn.sendMessage(m.chat, msg, { quoted: m });
}

async function sendLocationResults(conn, m, data) {
    const txt = `📍 *LOCATION: ${data.name}*\n\n🗺️ Type: ${data.type}\n⭐ Importance: ${(data.importance * 100).toFixed(1)}%\n🌐 Coordinates: ${data.lat}, ${data.lon}\n\n🔗 View on Map: ${data.mapUrl}\n\n_Powered by AI_`;
    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: { externalAdReply: { title: data.name, body: `${data.type} - OpenStreetMap`, thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', sourceUrl: data.mapUrl, mediaType: 1 } }
    }, { quoted: m });
}

async function sendGeneralResults(conn, m, data) {
    if (!data.results || data.results.length === 0) return reply(`🔍 No results found for "${data.query}"\n\nTry: https://www.google.com/search?q=${encodeURIComponent(data.query)}`);
    let txt = `🌐 *AI SMART SEARCH: ${data.query.toUpperCase()}*\n\n`;
    data.results.forEach((r, i) => {
        txt += `${i + 1}. *${r.title}*\n 📝 ${r.snippet}\n 🔗 ${r.url}\n\n`;
    });
    txt += '_Powered by AI_';
    await conn.sendMessage(m.chat, {
        text: txt,
        contextInfo: { externalAdReply: { title: 'AI Search', body: `Results for: ${data.query}`, thumbnailUrl: 'https://cdn-icons-png.flaticon.com/512/1170/1170678.png', sourceUrl: data.fallbackUrl || `https://www.google.com/search?q=${encodeURIComponent(data.query)}`, mediaType: 1 } }
    }, { quoted: m });
}