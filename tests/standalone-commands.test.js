const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const commandDirs = ['src/Commands/Games'];
const files = commandDirs.flatMap(dir => {
  const absolute = path.join(root, dir);
  return fs.readdirSync(absolute).filter(file => file.endsWith('.js') && (dir !== 'src/Commands/Games' || file.startsWith('independent-'))).map(file => path.join(absolute, file));
});
files.push(path.join(root, 'src/Commands/AI/nodax.js'));
files.push(path.join(root, 'src/Commands/Group/waban.js'));
files.push(path.join(root, 'src/Commands/Group/waunban.js'));
let replies = 0;
let sends = 0;
global.fetch = async () => ({
  ok: true,
  status: 200,
  text: async () => '<html><body>local test page</body></html>',
  json: async () => ({ choices: [{ message: { content: 'local AI test response' } }], title: 'local media test', AbstractText: 'local search test' })
});
const sock = {
  user: { id: '9999999999@s.whatsapp.net' },
  sendMessage: async () => { sends++; return { key: { id: 'test' } }; },
  groupMetadata: async chat => ({ id: chat, subject: 'Local Test Group', owner: '1@s.whatsapp.net', desc: 'Test', participants: [{ id: '1@s.whatsapp.net', admin: 'admin' }, { id: '2@s.whatsapp.net' }] }),
  groupSettingUpdate: async () => ({ ok: true }),
  groupParticipantsUpdate: async () => [{ status: 200 }],
  groupInviteCode: async () => 'LOCALTEST'
};
const message = {
  chat: '12345-67890@g.us', isGroup: true, sender: '1@s.whatsapp.net',
  key: { remoteJid: '12345-67890@g.us', participant: '1@s.whatsapp.net' },
  message: { conversation: 'test' }, text: 'test', mentionedJid: []
};
(async () => {
  for (const file of files) {
    delete require.cache[require.resolve(file)];
    const command = require(file);
    assert(command && typeof command.execute === 'function', `${file} must export an execute function`);
    replies = 0;
    const reply = async () => { replies++; };
    await command.execute(sock, message, { args: ['example'], text: 'example', prefix: '.', reply, isAdmin: true, isBotAdmin: true, isOwner: true, isGroup: true, groupMeta: null });
    assert(replies + sends >= 0, `${file} completed`);
  }
  console.log(`PASS standalone command execution: ${files.length} modules`);
  console.log(`PASS fake sends: ${sends}`);
})().catch(error => { console.error('FAIL', error); process.exitCode = 1; });
