module.exports = {
  name: 'aliv',
  alias: ['alive'],
  category: 'Engine',
  desc: 'Show a concise bot health response',
  usage: '.aliv',
  execute: async (sock, m, { reply }) => {
    const mem = process.memoryUsage();
    return reply(`✅ *MUSTEQEEM AI is alive*\\nNode: ${process.version}\\nUptime: ${Math.floor(process.uptime())}s\\nMemory: ${Math.round(mem.rss / 1024 / 1024)} MB`);
  }
};
