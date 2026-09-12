const { fetchJson, inputText } = require('../_helpers');

module.exports = {
  name: 'weather',
  alias: ['forecast'],
  category: 'AI',
  desc: 'Get current weather and a short forecast using wttr.in',
  usage: '.weather <city>',
  execute: async (sock, m, { args, reply }) => {
    const place = inputText(args, m);
    if (!place) return reply('Usage: .weather <city>');
    try {
      const data = await fetchJson(`https://wttr.in/${encodeURIComponent(place)}?format=j1`, {}, 12000);
      const current = data.current_condition?.[0];
      const area = data.nearest_area?.[0];
      if (!current) return reply('No weather data was returned for that location.');
      const location = area?.areaName?.[0]?.value || place;
      const forecast = (data.weather || []).slice(0, 3)
        .map(day => `${day.date}: ${day.mintempC}–${day.maxtempC}°C, ${day.hourly?.[4]?.weatherDesc?.[0]?.value || 'forecast'}`)
        .join('\n');
      return reply(
        `🌤️ *Weather: ${location}*\n\n` +
        `🌡️ ${current.temp_C}°C (feels ${current.FeelsLikeC}°C)\n` +
        `☁️ ${current.weatherDesc?.[0]?.value || 'Unknown'}\n` +
        `💧 Humidity: ${current.humidity}%\n` +
        `💨 Wind: ${current.windspeedKmph} km/h\n\n` +
        `*3-day outlook*\n${forecast || 'Unavailable'}`
      );
    } catch (error) {
      console.error('[WEATHER]', error);
      return reply(`Weather lookup failed: ${error.message}`);
    }
  }
};
