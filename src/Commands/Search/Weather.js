const axios = require("axios");

/* ===============================
   WEATHER EMOJI ENGINE
=============================== */

function getWeatherEmoji(weather) {
    const map = {
        Thunderstorm: "⛈️",
        Drizzle: "🌦️",
        Rain: "🌧️",
        Snow: "❄️",
        Mist: "🌫️",
        Smoke: "💨",
        Haze: "🌫️",
        Dust: "🌪️",
        Fog: "🌫️",
        Sand: "🏜️",
        Ash: "🌋",
        Squall: "💨",
        Tornado: "🌪️",
        Clear: "☀️",
        Clouds: "☁️"
    };
    return map[weather] || "🌍";
}

/* ===============================
   EXPORT PLUGIN
=============================== */

module.exports = {
    name: "weather",
    alias: ["wthr", "forecast"],
    category: "Tools",
    usage: ".weather <city>",
    desc: "Get current weather for any city",
    reactions: { start: '⛅', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '⛅', key: m.key } });

        const city = args.join(" ").trim();
        if (!city) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
       • WEATHER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.weather <city>
│
│ ❏ *EXAMPLES*
│ •.weather Lagos
│ •.weather London
│ •.weather New York
╰─────────────────────────╯`
            );
        }

        try {
            await sock.sendPresenceUpdate("composing", m.chat);

            const API_KEY = "e6926030169752d7e0d85377e489c415";
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
            const { data } = await axios.get(url);

            const emoji = getWeatherEmoji(data.weather[0].main);

            const tableData = [
                ['Property', 'Value'],
                ['Location', `${data.name}, ${data.sys.country}`],
                ['Condition', `${emoji} ${data.weather[0].description}`],
                ['Temperature', `${data.main.temp}°C`],
                ['Feels Like', `${data.main.feels_like}°C`],
                ['Humidity', `${data.main.humidity}%`],
                ['Wind', `${data.wind.speed} m/s`],
                ['Pressure', `${data.main.pressure} hPa`],
                ['Coordinates', `${data.coord.lat}, ${data.coord.lon}`]
            ];

            await sock.sendMessage(m.chat, {
                headerText: `◈ ${emoji} Weather Report`,
                contentText: '---',
                title: `◈ ${data.name}`,
                table: tableData,
                footerText: '💡 Powered by OpenWeather • ⚡ Powered by AI ֎'
            }, { quoted: m });

            await sock.sendPresenceUpdate("paused", m.chat);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (error) {
            console.error("Weather Error:", error.response?.data || error.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • WEATHER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Unable to fetch weather
│
│ ❏ *NOTE*
│ • Check city name and try again
╰─────────────────────────╯`
            );
        }
    }
};