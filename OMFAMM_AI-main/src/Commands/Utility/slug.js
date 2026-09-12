module.exports = {
  name: 'slug',
  alias: ['urlslug', 'slugify'],
  category: 'Utility',
  desc: 'Convert text into a clean, URL-friendly slug',
  usage: '.slug [text] | .slug -sep _ -max 50 [text]',

  execute: async (sock, m, { args, reply }) => {
    try {
      let inputArgs = Array.isArray(args) ? [...args] : [];

      // Options
      let separator = '-';
      let maxLength = 0;

      // --separator / -sep
      const sepIndex = inputArgs.findIndex(
        x => x === '-sep' || x === '--separator'
      );

      if (sepIndex !== -1 && inputArgs[sepIndex + 1]) {
        separator = String(inputArgs[sepIndex + 1])
          .replace(/[^a-zA-Z0-9_-]/g, '')
          .slice(0, 3) || '-';

        inputArgs.splice(sepIndex, 2);
      }

      // --max / -max
      const maxIndex = inputArgs.findIndex(
        x => x === '-max' || x === '--max'
      );

      if (maxIndex !== -1 && inputArgs[maxIndex + 1]) {
        const parsed = parseInt(inputArgs[maxIndex + 1], 10);

        if (!Number.isNaN(parsed) && parsed > 0) {
          maxLength = Math.min(parsed, 200);
        }

        inputArgs.splice(maxIndex, 2);
      }

      // Get input from arguments or quoted message
      let input = inputArgs.join(' ').trim();

      if (!input) {
        input = m?.quoted?.text?.trim() || '';
      }

      if (!input) {
        return reply(
          '❌ Provide some text.\n\n' +
          'Example:\n' +
          '.slug My Awesome WhatsApp Bot'
        );
      }

      // Normalize Unicode
      let slug = input
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')

        // Convert common symbols
        .replace(/&/g, ' and ')

        // Keep letters/numbers, turn everything else into separator
        .replace(/[^a-zA-Z0-9]+/g, separator)

        // Lowercase
        .toLowerCase()

        // Remove duplicate separators
        .replace(
          new RegExp(
            `${escapeRegExp(separator)}+`,
            'g'
          ),
          separator
        )

        // Remove separators from beginning/end
        .replace(
          new RegExp(
            `^${escapeRegExp(separator)}+|${escapeRegExp(separator)}+$`,
            'g'
          ),
          ''
        );

      if (!slug) {
        return reply('❌ Unable to generate a valid slug from that text.');
      }

      // Apply maximum length without leaving a trailing separator
      if (maxLength && slug.length > maxLength) {
        slug = slug
          .slice(0, maxLength)
          .replace(
            new RegExp(
              `${escapeRegExp(separator)}+$`,
              'g'
            ),
            ''
          );
      }

      return reply(
        `🔗 *SLUG GENERATED*\n\n` +
        `📝 Input: ${input}\n` +
        `🔗 Slug: ${slug}\n` +
        `📏 Length: ${slug.length}`
      );

    } catch (error) {
      console.error('[SLUG ERROR]', error);
      return reply(`❌ Error: ${error.message}`);
    }
  }
};

// Escape characters for use inside RegExp
function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}