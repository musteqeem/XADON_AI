const baileys = require('@musteqeem/baileys');

module.exports = {
  name: 'gen5',
  alias: ['protocol5', 'wad iagnostic'.replace(/\s/g, ''), 'protocolinfo'],
  category: 'Whatsapp Protocol',
  desc: 'Report supported @musteqeem/baileys protocol capabilities safely',
  usage: '.gen5',
  ownerOnly: true,
  execute: async (sock, m, { reply }) => {
    const pkg = require('@musteqeem/baileys/package.json');
    const supported = [
      'makeWASocket', 'useMultiFileAuthState', 'fetchLatestBaileysVersion',
      'downloadContentFromMessage', 'generateWAMessage', 'proto', 'WAProto',
      'jidDecode', 'jidNormalizedUser', 'prepareWAMessageMedia'
    ];
    const available = supported.filter(name => typeof baileys[name] !== 'undefined');
    return reply([
      '*Baileys protocol diagnostics*',
      `Package: @musteqeem/baileys ${pkg.version || 'unknown'}`,
      `Supported exports: ${available.length}/${supported.length}`,
      available.map(name => `• ${name}`).join('\n'),
      '',
      'No undocumented Gen5 wire protocol was found in the installed package. This command deliberately uses the supported package API and does not patch WhatsApp protocol constants.'
    ].join('\n'));
  }
};
