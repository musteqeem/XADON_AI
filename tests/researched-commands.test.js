const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src', 'Commands');
const sets = {
  Utility: ['ping','uptime','calc','urlcheck','wiki','define','weather','translate','quote','joke'],
  Media: ['autodl','yt','tts','mediafire'],
  Defense: ['antilink','antispam','warn','appeal','anticall'],
  Admin: ['promote','demote','kick','lockgc','unlockgc','setsubject','setdesc'],
  Group: ['groupinfo','members','admins','tagall','hidetag','invite','waban','waunban'],
  Search: ['movie','githubinfo','safesearch']
};
const files = Object.entries(sets).flatMap(([dir, names]) => names.map(name => path.join(root, dir, name + '.js')));
let replies = 0;
global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ responseData: { translatedText: 'test' }, content: 'test', author: 'test', AbstractText: 'test', choices: [{ message: { content: 'test' } }], url: 'https://example.com/file.mp3' }), text: async () => '<html>test</html>', headers: new Map() });
const sock = {
  sendMessage: async () => ({}),
  groupMetadata: async () => ({ id: 'test@g.us', subject: 'Test', owner: '1@s.whatsapp.net', participants: [{ id: '1@s.whatsapp.net', admin: 'admin' }, { id: '2@s.whatsapp.net' }] }),
  groupParticipantsUpdate: async () => [{ status: 200 }],
  groupSettingUpdate: async () => ({}),
  groupUpdateSubject: async () => ({}),
  groupUpdateDescription: async () => ({}),
  groupInviteCode: async () => 'TESTCODE'
};
const message = { chat: 'test@g.us', isGroup: true, sender: '1@s.whatsapp.net', key: { participant: '1@s.whatsapp.net' }, mentionedJid: ['2@s.whatsapp.net'], quoted: { sender: '2@s.whatsapp.net' }, message: { conversation: 'test' }, text: 'test' };
(async () => {
  for (const file of files) {
    assert(fs.existsSync(file), `Missing ${file}`);
    const command = require(file);
    assert.equal(typeof command.execute, 'function');
    await command.execute(sock, message, { args: ['example'], reply: async () => { replies++; }, isAdmin: true, isBotAdmin: true, isOwner: true });
  }
  console.log(`PASS researched command execution: ${files.length} modules; replies=${replies}`);
})().catch(error => { console.error('FAIL', error); process.exitCode = 1; });
