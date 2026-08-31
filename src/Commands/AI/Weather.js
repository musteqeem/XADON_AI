const axios = require('axios');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || config.api?.weather || '';
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY || config.api?.weatherapi || '';

function getWeatherEmoji(weather) {
    const map = {
        Thunderstorm: '⛈️', Drizzle: '🌦️', Rain: '🌧️', Snow: '❄️',
        Mist: '🌫️', Smoke: '💨', Haze: '🌫️', Dust: '🌪️', Fog: '🌫️',
        Sand: '🏜️', Ash: '🌋', Squall: '💨', Tornado: '🌪️',
        Clear: '☀️', Clouds: '☁️'
    };
    return map[weather] || '🌍';
}

// 3 WEATHER APIs WITH FALLBACK
const WEATHER_APIS = [
    {
        name: 'OpenWeatherMap',
        fetch: async (city) => {
            if (!WEATHER_API_KEY) throw new Error('No API key');
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${WEATHER_API_KEY}&units=metric`;
            const { data } = await axios.get(url, { timeout: 15000 });
            return {
                city: data.name,
                country: data.sys.country,
                condition: data.weather[0].main,
                desc: data.weather[0].description,
                temp: data.main.temp,
                feels: data.main.feels_like,
                min: data.main.temp_min,
                max: data.main.temp_max,
                humidity: data.main.humidity,
                wind: data.wind.speed,
                pressure: data.main.pressure,
                visibility: (data.visibility / 1000).toFixed(1),
                sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
                sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
                coords: `${data.coord.lat}, ${data.coord.lon}`
            };
        }
    },
    {
        name: 'WeatherAPI.com',
        fetch: async (city) => {
            if (!WEATHERAPI_KEY) throw new Error('No API key');
            const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${encodeURIComponent(city)}`;
            const { data } = await axios.get(url, { timeout: 15000 });
            return {
                city: data.location.name,
                country: data.location.country,
                condition: data.current.condition.text,
                desc: data.current.condition.text,
                temp: data.current.temp_c,
                feels: data.current.feelslike_c,
                min: data.current.temp_c,
                max: data.current.temp_c,
                humidity: data.current.humidity,
                wind: data.current.wind_kph / 3.6,
                pressure: data.current.pressure_mb,
                visibility: data.current.vis_km,
                sunrise: data.location.localtime,
                sunset: 'N/A',
                coords: `${data.location.lat}, ${data.location.lon}`
            };
        }
    },
    {
        name: 'WTTR.in',
        fetch: async (city) => {
            const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
            const { data } = await axios.get(url, { timeout: 15000 });
            const current = data.current_condition[0];
            const area = data.nearest_area[0];
            return {
                city: area.areaName[0].value,
                country: area.country[0].value,
                condition: current.weatherDesc[0].value,
                desc: current.weatherDesc[0].value,
                temp: current.temp_C,
                feels: current.FeelsLikeC,
                min: data.weather[0].mintempC,
                max: data.weather[0].maxtempC,
                humidity: current.humidity,
                wind: current.windspeedKmph / 3.6,
                pressure: current.pressure,
                visibility: current.visibility,
                sunrise: data.weather[0].astronomy[0].sunrise,
                sunset: data.weather[0].astronomy[0].sunset,
                coords: `${data.nearest_area[0].latitude}, ${data.nearest_area[0].longitude}`
            };
        }
    }
];

module.exports = {
    name: 'weather',
    alias: ['wthr', 'forecast', 'climate', 'temp'],
    desc: `${BOT_NAME} Get weather forecast with 3 API fallbacks`,
    category: 'Search',
    usage: '.weather <city>',
    reactions: { start: '⛅', success: '✨', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const city = args.join(' ').trim();

        if (!city) {
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} WEATHER •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ ${prefix}weather <city>\n│ \n│ ❏ *Examples:*\n│ ❏ ${prefix}weather Lagos\n│ ❏ ${prefix}weather London\n│ ❏ ${prefix}weather Tokyo\n│ \n│ ❏ *Feature:* Real-time weather data\n╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(jid, { react: { text: '⛅', key: m.key } });
        await reply(`❏ *Fetching weather for ${city}...*`);

        let data = null;
        let sourceUsed = '';

        // Try all 3 APIs
        for (let i = 0; i < WEATHER_APIS.length; i++) {
            try {
                console.log(`[WEATHER] Trying ${WEATHER_APIS[i].name}`);
                data = await WEATHER_APIS[i].fetch(city);
                sourceUsed = WEATHER_APIS[i].name;
                if (data) break;
            } catch (e) {
                console.log(`[WEATHER] ${WEATHER_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!data) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ City not found or all APIs failed\n❏ Check the city name and try again`);
        }

        const emoji = getWeatherEmoji(data.condition);

        await sock.sendMessage(jid, {
            headerText: `## ${emoji} ${data.city}, ${data.country}`,
            contentText: '---',
            title: '📊 Weather Report',
            table: [
                ['🌤️ Condition', `${emoji} ${data.desc}`],
                ['🌡️ Temperature', `${data.temp}°C`],
                ['🤒 Feels Like', `${data.feels}°C`],
                ['📉 Min / Max', `${data.min}°C / ${data.max}°C`],
                ['💧 Humidity', `${data.humidity}%`],
                ['🌬️ Wind', `${parseFloat(data.wind).toFixed(1)} m/s`],
                ['📊 Pressure', `${data.pressure} hPa`],
                ['👁️ Visibility', `${data.visibility} km`],
                ['🌅 Sunrise', data.sunrise],
                ['🌇 Sunset', data.sunset],
                ['🌐 Coordinates', data.coords],
                ['📡 Source', sourceUsed]
            ],
            footerText: `💡 Powered by ${BOT_NAME}`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

    } catch (error) {
        console.error('[WEATHER ERROR]', error.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        reply(`✘ ❏ Failed to fetch weather data`);
    }
}
};