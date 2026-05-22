const IMAGES = [
  'https://files.catbox.moe/bkvkel.jpeg',
  'https://files.catbox.moe/bkvkel.jpeg',
  'https://files.catbox.moe/bkvkel.jpeg'
];

const DIVIDER = '⿻ ⿻';
const READMORE = String.fromCharCode(0x200e).repeat(0xfa1); // invisible char to expand "read more"

const CATEGORY_ICONS = {
  ai: '𓄂ᬼ𓆃',
  search: '❔',
  admin: 'ⓘ 𝓶𝓾𝓼𝓽𝓮𝓺𝓮𝓮𝓶 𝓿𝓮𝓻𝓲𝓯𝓲𝓮𝓭 ✓',
  anime: '✯',
  audio: '♪',
  bot: '⚉',
  converter: '℘',
  core: '𓀀',
  documents: '彡',
  downloader: '⎙',
  economy: '𓃼',
  fun: 'ಥ⁠‿⁠ಥ',
  group: 'ᄒ⁠ᴥ⁠ᄒ',
  media: '㉨',
  'media-editor': '✐',
  overlays: '✧',
  owner: 'ⓘ',
  tools: '⎔',
  utils: '❂',
  textmaker: '✦',
  general: '◦'
};

function getIcon(category) {
  return CATEGORY_ICONS[category.toLowerCase()] || '◈';
}

function buildText(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories) {
  let text = '';
  
  text += `⌘ ══〔 *${botName.toUpperCase()}* 〕══ ⌘\n`;
  text += DIVIDER + '\n\n';
  text += `𒆜 ✦ *Hello, ${userName}*\n`;
  text += `❏◦ Number  · ✐ ${userNum}\n`;
  text += `❏◦ Prefix  · ✐ [ ${prefix} ]\n`;
  text += `❏◦ Cmds    · ✐ ${totalCmds} commands\n`;
  text += `❏◦ Uptime  · ✐ ${uptimeMin}m\n`;
  text += `❏◦ RAM     · ✐ ${storage}\n`;
  text += `❏◦ Time    · ✐ ${time}\n`;
  text += DIVIDER + '\n';
  text += READMORE;

  for (const [category, cmds] of Object.entries(categories)) {
    const icon = getIcon(category);
    text += `\n︎𖣘 ◈ *${category.toUpperCase()}* ${icon}\n`;
    
    const seen = new Set();
    for (const cmd of cmds) {
      if (!cmd?.name) continue;
      const name = cmd.name.toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);
      text += `❏◦ ➪ ${prefix}${cmd.name}\n`;
    }
  }

  text += '\n⌘ XADON AI 𓀀';
  return text;
}

module.exports = async function sendStyle6(sock, chatId, {
  userName,
  userNum,
  prefix,
  botName,
  uptimeMin,
  totalCmds,
  storage,
  time,
  categories
}) {
  const imageUrl = IMAGES[Math.floor(Math.random() * IMAGES.length)];
  const caption = buildText(userName, userNum, prefix, botName, uptimeMin, totalCmds, storage, time, categories);

  const contextInfo = {
    forwardingScore: 999,
    isForwarded: true,
    participant: '120363402922206865@newsletter',
    remoteJid: 'status@broadcast',
    quotedMessage: { conversation: '```ஃ𖠃 XADON AI🜲``` ' },
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363402922206865@newsletter',
      newsletterName: 'ⓘ 𝓶𝓾𝓼𝓽𝓮𝓺𝓮𝓮𝓶 𝓿𝓮𝓻𝓲𝓯𝓲𝓮𝓭 ✓',
      serverMessageId: 1
    }
  };

  const quotedMsg = {
    key: {
      remoteJid: 'status@broadcast',
      fromMe: false,
      participant: '0@s.whatsapp.net',
      id: 'XADON' + Math.random().toString(16).substring(2, 10).toUpperCase()
    },
    message: { conversation: '\n⌘ ══〔 𖣘 𝐎𝐌𝐅𝐀𝐌𝐌 ❀ 〕══ ⌘' }
  };

  await sock.sendMessage(chatId, {
    image: { url: imageUrl },
    caption: caption,
    contextInfo: contextInfo
  }, { quoted: quotedMsg });
};