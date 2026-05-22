const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
  name: 'npm',
  alias: [],
  desc: 'Manage npm packages (owner only)',
  category: 'Owner',
  ownerOnly: true,
  reactions: {
    start: '♻️',
    success: '📦'
  },
  execute: async (msg, sock, { reply, text }) => {
    if (!text) {
      return reply(
        '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n' +
        ' *֎ • NPM MENU*\n' +
        '✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n' +
        '*Commands:*\n' +
        '֎.npm install <pkg> → install\n' +
        '֎.npm uninstall <pkg> → remove\n' +
        '֎.npm list /.pkgs → list installed\n' +
        '֎.npm update → update all\n' +
        '֎.npm update <pkg> → update specific\n' +
        '֎.npm audit → security scan\n' +
        '֎.npm fund → funding links'
      );
    }

    const args = text.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    let npmCmd = '';
    let statusMsg = '֎ xdn marks Running...';
    let successMsg = '';

    switch (cmd) {
      case 'install':
        if (args.length < 2) return reply('Missing package');
        npmCmd = 'npm install ' + args.slice(1).join(' ');
        statusMsg = '_✪ Installing..._';
        successMsg = '*✓ Installed!*';
        break;

      case 'uninstall':
      case 'remove':
        if (args.length < 2) return reply('Missing package');
        npmCmd = 'npm uninstall ' + args.slice(1).join(' ');
        statusMsg = 'Uninstalling...';
        successMsg = 'Uninstalled!';
        break;

      case 'list':
      case 'pkgs':
        npmCmd = 'npm list --depth=0';
        statusMsg = 'Fetching list...';
        successMsg = 'Installed packages:';
        break;

      case 'update':
        npmCmd = args.length === 1
        ? 'npm update'
          : 'npm update ' + args.slice(1).join(' ');
        statusMsg = '_𓉤 Updating..._';
        successMsg = '*✓ Updated!*';
        break;

      case 'audit':
        npmCmd = 'npm audit --json';
        statusMsg = 'Scanning vulnerabilities...';
        successMsg = 'Security audit:';
        break;

      case 'fund':
        npmCmd = 'npm fund';
        statusMsg = '_✪ Fetching funding info..._';
        successMsg = 'Funding links:';
        break;

      default:
        return reply('Unknown command');
    }

    await reply(`${statusMsg}\n\`${npmCmd}\``);

    try {
      const { stdout, stderr } = await execPromise(npmCmd, { cwd: '/home/container' });

      let output = (stdout + stderr).trim();

      // Truncate if too long for WhatsApp
      if (output.length > 3500) {
        output = output.substring(0, 3400) + '\n(truncated)';
      }
      if (!output) output = 'Success (no output)';

      await reply(`${successMsg}\n\`\n${output}\n\`\``);

    } catch (err) {
      // Special case: npm audit returns exit code 1 when vulns are found
      if (cmd === 'audit' && err.code === 1) {
        let vulnOutput = (err.stdout || '') + (err.stderr || '');
        vulnOutput = vulnOutput.trim();

        if (vulnOutput.length > 3500) {
          vulnOutput = vulnOutput.substring(0, 3400) + '\n(truncated)';
        }
        if (!vulnOutput) vulnOutput = '(vulnerabilities found, but no detailed output)';

        await reply(`Vulnerabilities found (normal):\n\`\n${vulnOutput}\`\``);
      } else {
        let errorMsg = err.message || 'Unknown error';
        if (err.code) errorMsg += `\nExit code: ${err.code}`;
        if (err.stdout) errorMsg += `\nStdout: ${err.stdout.substring(0, 1000)}`;

        await reply(`Failed:\n${errorMsg}`);
      }
    }
  }
};