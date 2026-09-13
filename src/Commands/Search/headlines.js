const { inputText } = require('../_helpers');

module.exports = {
  name: 'headlines',
  alias: ['news'],
  category: 'Search',
  desc: 'Read current headlines from Google News RSS',
  usage: '.headlines [topic]',
  execute: async (sock, m, { args, reply }) => {
    const q = inputText(args, m) || 'world';
    try {
      const response = await fetch(
        `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=US&ceid=US:en`,
        { headers: { 'User-Agent': 'MUSTEQEEM-AI/3.0' }, signal: AbortSignal.timeout(15000) }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
        .slice(0, 7)
        .map(match => {
          const block = match[1];
          const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
          const title = rawTitle.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
          const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
          return title ? `• ${title}${link ? `\n  ${link}` : ''}` : null;
        })
        .filter(Boolean);
      return reply(`📰 *Headlines: ${q}*\n\n${items.join('\n\n') || 'No headlines found.'}`);
    } catch (error) {
      return reply(`News lookup failed: ${error.message}`);
    }
  }
};
