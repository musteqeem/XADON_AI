#!/usr/bin/env node
/**
 * XADON AI — Production AutoDeployer
 * Repository: https://github.com/musteqeem/XADON_AI
 *
 * Safe by design:
 * - never deletes the whole installation
 * - preserves sessions/, database/, .env and backups
 * - refuses to use an unrelated existing directory
 * - installs dependencies and validates index.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const readline = require('readline');

const REPO = process.env.XADON_REPO || 'https://github.com/musteqeem/XADON_AI.git';
const BRANCH = process.env.XADON_BRANCH || 'main';
const APP_DIR = path.resolve(process.env.XADON_DIR || path.join(process.cwd(), 'XADON_AI'));

const cyan = s => `\x1b[36m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;

function run(cmd, args, cwd = process.cwd()) {
  console.log(cyan(`$ ${cmd} ${args.join(' ')}`));
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

function exists(command) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'sh',
      process.platform === 'win32' ? [command] : ['-lc', `command -v ${command}`],
      { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function main() {
  console.log(cyan(`
╔══════════════════════════════════════════════════╗
║             XADON AI PRO AUTO DEPLOYER           ║
║          MUSTEQEEM/XADON_AI • PRODUCTION         ║
╚══════════════════════════════════════════════════╝
`));

  if (!exists('git')) throw new Error('Git is required.');
  if (!exists('npm')) throw new Error('npm is required.');
  if (Number(process.versions.node.split('.')[0]) < 20) {
    throw new Error(`Node.js 20+ required. Found ${process.version}.`);
  }

  if (fs.existsSync(APP_DIR)) {
    if (!fs.existsSync(path.join(APP_DIR, '.git'))) {
      throw new Error(`${APP_DIR} exists but is not an XADON Git repository.`);
    }

    console.log(yellow('Existing installation detected — updating safely.'));
    process.chdir(APP_DIR);

    for (const dir of ['sessions', 'database', 'logs', 'backups']) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = path.join(APP_DIR, 'backups', `autodeployer-${ts}`);
    fs.mkdirSync(backup, { recursive: true });

    for (const item of ['sessions', 'database']) {
      if (fs.existsSync(item)) fs.cpSync(item, path.join(backup, item), { recursive: true });
    }
    if (fs.existsSync('.env')) fs.copyFileSync('.env', path.join(backup, '.env'));

    run('git', ['fetch', '--prune', 'origin', BRANCH]);
    run('git', ['reset', '--hard', `origin/${BRANCH}`]);

    for (const item of ['sessions', 'database']) {
      const source = path.join(backup, item);
      if (fs.existsSync(source)) {
        fs.rmSync(item, { recursive: true, force: true });
        fs.cpSync(source, item, { recursive: true });
      }
    }
    if (fs.existsSync(path.join(backup, '.env'))) fs.copyFileSync(path.join(backup, '.env'), '.env');
  } else {
    if (fs.existsSync(APP_DIR)) throw new Error('Target directory already exists.');
    run('git', ['clone', '--branch', BRANCH, '--single-branch', REPO, APP_DIR]);
    process.chdir(APP_DIR);
  }

  for (const dir of ['sessions', 'database', 'logs', 'backups']) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync('.env')) {
    const botName = await ask('Bot name [XADON AI]: ') || 'XADON AI';
    const owner = await ask('Owner number [optional]: ');
    const prefix = await ask('Prefix [.]: ') || '.';
    fs.writeFileSync('.env',
      `NODE_ENV=production\nBOT_NAME=${botName}\nOWNER_NUMBER=${owner}\nPREFIX=${prefix}\nSESSION_NAME=sessions\nPORT=3000\n`,
      { mode: 0o600 });
  } else {
    console.log(green('Existing .env preserved.'));
  }

  if (fs.existsSync('package-lock.json')) run('npm', ['ci', '--omit=dev']);
  else run('npm', ['install', '--omit=dev']);

  run('node', ['--check', 'index.js']);
  run('npm', ['run', 'doctor', '--if-present']);

  console.log(green('\n✓ Deployment complete.'));
  console.log(`Directory: ${APP_DIR}`);
  console.log('Session:   sessions/ (preserved)');
  console.log('\nStarting XADON AI...\n');

  const child = spawn(process.execPath, ['index.js'], {
    cwd: APP_DIR,
    stdio: 'inherit',
    env: process.env
  });
  child.on('exit', code => process.exit(code ?? 0));
}

main().catch(err => {
  console.error(red(`\n✖ Deployment failed: ${err.message}`));
  process.exit(1);
});
