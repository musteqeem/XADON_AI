const { setGhostMode, isGhostMode } = require('../../Plugin/statusHandler');

module.exports = {
  name: 'ghosted',
  alias: ['statusghost', 'cleanser', 'sg'],
  desc: 'Ghost mode: react then erase all status presence',
  category: 'Owner',
  usage: '.ghosted on | .ghosted off | .ghosted status',

  execute: async (sock, m, { args, reply, isOwner }) => {
    if (!isOwner) return reply('`𖣘 Owner only command`');

    const sub = args[0]?.toLowerCase() || 'status';

    if (sub === 'on') {
      setGhostMode(true);
      return reply(
        '╭─❍ *GHOSTED MODE* 𓉤\n' +
        '│\n' +
        '│ ✓ UNIVERSAL ERASER ACTIVE\n' +
        '│ 𓄄 Every status gets liked then erased\n' +
        '│ ⚉ Your presence vanishes in 2 seconds\n' +
        '╰──────────────────'
      );
    }

    if (sub === 'off') {
      setGhostMode(false);
      return reply(
        '╭─❍ *GHOSTED MODE* 𓉤\n' +
        '│\n' +
        '│ ✘ Ghost mode OFF\n' +
        '│ ⚉ Normal auto-like behavior restored\n' +
        '╰──────────────────'
      );
    }

    const active = isGhostMode();
    return reply(
      '╭─❍ *GHOSTED STATUS* 𓉤\n' +
      '│\n' +
      `│ ⚉ Mode: ${active ? '✓ ACTIVE' : '✘ OFF'}\n` +
      '│\n' +
      '│ ON  → React + Erase on every status\n' +
      '│ OFF → Normal auto-like stays permanent\n' +
      '╰──────────────────'
    );
  }
};
