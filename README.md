
<div align="center">

  # 🌌 𝐗𝐀𝐃𝐎𝐍 𝐀𝐈 𝐕2  – Ultra Defense + Main Core 🛡️⚡

  **The Self-Healing, Anti-Ban WhatsApp Automation Engine**  
  Built with ❤️ by **Musteqeem** aka **Future Scientist** 👨‍💻✨

  [![GitHub license](https://img.shields.io/github/license/musteqeem/XADON_AI?style=flat-square)](https://github.com/musteqeem/XADON_AI/blob/main/LICENSE)
  [![GitHub stars](https://img.shields.io/github/stars/musteqeem/XADON_AI?style=flat-square&color=yellow)](https://github.com/musteqeem/XADON_AI/stargazers)
  [![WhatsApp MD](https://img.shields.io/badge/WhatsApp-MultiDevice-green?style=flat-square&logo=whatsapp)](https://wa.me/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
  [![Deploy](https://img.shields.io/badge/Deploy-1Click-38bdf8?style=flat-square)](https://xadon.vercel.app)

  <img src="https://images.stockcake.com/public/d/c/f/dcffb5bb-5568-4b64-b196-e2f88ad91464/luminous-polygon-armor-stockcake.jpg" alt="XADON Ultra Defense Core" width="600">

  **XADON AI V2** – Your cyber guardian with an internal firewall.  
  Comes with `index.js` AutoDeployer: 1 file to clone, fix, obfuscate, and launch the bot on any panel in 60 seconds.

</div>

---

✨ What's New in V2

- 🛡️ **Ultra Defense Core** – Auto-fix, auto-obfuscate, anti-500 session loop protection
- ⚡ **1-Click AutoDeployer** – `index.js` handles git clone → fix → obf → pm2 → launch
- 🔒 **Firewall Shield** – `utils/obf.js` encrypts core files to prevent leaks
- 🔧 **Internal Protocol Fix** – `utils/fix.js` patches all commands automatically
- 🤖 **AI-Powered Intelligence** – Smart replies, memory, context
- ⚙️ **PM2 24/7 Uptime** – Auto-restart, crash protection, logs
- 🌐 **Multi-Device Stable** – QR + Pairing Code support
- 🎯 **3000+ Commands** – Admin, Media, AI, Download, Fun, Utility, NSFW opt-in

> V1 was the weapon. V2 is the armor.

---

🚀 60-Second Deploy Tutorial

The bot **WILL NOT WORK** without running the AutoDeployer first.

Step 1: Upload Deployer
1. Go to your hosting panel e.g [Spaceify](https://client.spaceify.eu)
2. File Manager → Create new file → Name it: `index.js`
3. Paste the AutoDeployer code from below

Step 2: Run Deployer
In Console tab run:
```bash
node index.js
Step 3: Follow On-Screen Setup
The script will auto:
1.  `📦 Clone` the latest XADON_AI repo
2.  `🔧 Fix` all files with `utils/fix.js`
3.  `🔒 Obfuscate` with `utils/obf.js` - Defense Shield ON
4.  `📚 npm install` + `pm2` install
5.  `⚙️ Ask` for Bot Name, Owner Number, Prefix
6.  `📝 Create .env`
7.  `🚀 Launch` bot with PM2 24/7

Step 4: Connect WhatsApp
Console will show QR or Pairing Code → WhatsApp → Linked Devices → Link

Done! Your bot is live and protected 🛡️
```
---

📦 The AutoDeployer Script

Save this as `index.js` in your panel root before starting
```bash
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

const REPO = 'https://github.com/musteqeem/XADON_AI.git';
const FOLDER = 'XADON_AI';
const ENV_PATH = path.join(FOLDER, '.env');
const FIX_PATH = path.join(FOLDER, 'utils', 'fix.js');
const OBF_PATH = path.join(FOLDER, 'utils', 'obf.js');
const PKG_PATH = path.join(FOLDER, 'package.json');

const line = chalk.cyan('✦ ───── ⋆⋅☆⋅⋆ ───── ✦');
const header = (text) => console.log(`\n${line}\n  ${chalk.bold.magenta('֎ • ' + text)}\n${line}\n`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(chalk.yellow(q), res));

async function main() {
    console.clear();
    header(`${BOT_UI()} XADON AI V2 ULTRA DEPLOYER ${BOT_UI()}`);
    console.log(chalk.green('👋 Welcome Boss!'));
    console.log(chalk.gray('This will clone, fix, obfuscate, setup PM2, and launch XADON AI\n'));

    // 1. CLONE
    header('📦 STEP 1: CLONING REPOSITORY');
    if (fs.existsSync(FOLDER)) fs.rmSync(FOLDER, { recursive: true, force: true });
    execSync(`git clone ${REPO}`, { stdio: 'inherit' });

    // 2. FIX
    header('🔧 STEP 2: RUNNING INTERNAL PROTOCOL FIX');
    execSync('node utils/fix.js', { cwd: FOLDER, stdio: 'inherit' });

    // 2.5 OBF
    header('🔒 STEP 2.5: ACTIVATING FIREWALLS DEFENSE SHIELD');
    execSync('node utils/obf.js', { cwd: FOLDER, stdio: 'inherit' });

    // 3. RESET START
    header('🔄 STEP 3: RESETTING START COMMAND');
    let pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    pkg.scripts.start = 'node index.js';
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2));

    // 4. INSTALL
    header('📚 STEP 4: INSTALLING DEPENDENCIES + PM2');
    execSync('npm install', { cwd: FOLDER, stdio: 'inherit' });
    execSync('npm i -g pm2', { stdio: 'inherit' });

    // 5. CONFIG
    header('⚙️ STEP 5: BOT CONFIGURATION');
    let botName = await ask('🤖 Enter Your Bot Name: ') || 'XADON AI';
    let ownerNumber = await ask('📱 Enter Owner Number with country code: ') || '2347079056039';
    let prefix = await ask('⌨️  Enter Command Prefix [default: .]: ') || '.';

    // 6. .env
    header('📝 STEP 6: CREATING .env FILE');
    fs.writeFileSync(ENV_PATH, `BOT_NAME=${botName}\nOWNER_NUMBER=${ownerNumber}\nPREFIX=${prefix}\nSESSION_ID=\n`);

    rl.close();

    // 7. LAUNCH
    header(`🚀 STEP 7: LAUNCHING ${botName} WITH PM2`);
    try { execSync('pm2 delete XADON_AI', { stdio: 'ignore' }); } catch {}
    execSync(`pm2 start npm --name "XADON_AI" -- start`, { cwd: FOLDER, stdio: 'inherit' });
    execSync('pm2 save', { stdio: 'inherit' });

    header('✅ DEPLOYMENT COMPLETE');
    console.log(chalk.green(`${botName} is now running 24/7`));
    console.log(chalk.cyan('Commands: pm2 logs XADON_AI | pm2 restart XADON_AI'));
}

function BOT_UI() { return '𖣘' }
main().catch(err => { console.error(chalk.red('Fatal error:'), err); process.exit(1); });
```
*Important*: After first deploy, run `pm2 startup` once so bot survives server reboot.
*Strict note if the autodeployer script above didnt work for your pterodactly panel use this stable and ultra fast on node 23+*

😁 AUTODEPLOYER SCRIPT V2 PRO EDITION

```bash
#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║              ֎ XADON AI PRO AUTODEPLOYER             ║
 * ║           MUSTEQEEM/XADON_AI • PRODUCTION            ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * XADON AI Production AutoDeployer
 *
 * Features:
 * - Safe Git deployment
 * - Persistent sessions/
 * - Persistent database/
 * - Persistent .env
 * - Automatic backups
 * - BOT_NAME configuration
 * - OWNER_NUMBER configuration
 * - PREFIX configuration
 * - Blue + Rainbow UI
 * - Dependency installation
 * - index.js validation
 * - Non-fatal doctor check
 * - Automatic startup
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {
  execFileSync,
  spawn
} = require('child_process');
const readline = require('readline');

/* ═══════════════════════════════════════════════════════
   DEPLOYMENT CONFIG
═══════════════════════════════════════════════════════ */

const REPO =
  process.env.XADON_REPO ||
  'https://github.com/musteqeem/XADON_AI.git';

const BRANCH =
  process.env.XADON_BRANCH ||
  'main';

const APP_DIR = path.resolve(
  process.env.XADON_DIR ||
  path.join(process.cwd(), 'XADON_AI')
);

/* ═══════════════════════════════════════════════════════
   ANSI COLORS
═══════════════════════════════════════════════════════ */

const RESET = '\x1b[0m';

const COLORS = {
  blue: '\x1b[38;5;39m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',

  green: '\x1b[32m',
  brightGreen: '\x1b[92m',

  yellow: '\x1b[33m',

  red: '\x1b[31m',
  brightRed: '\x1b[91m',

  white: '\x1b[97m',
  gray: '\x1b[90m',

  magenta: '\x1b[35m',
  brightMagenta: '\x1b[95m'
};

/* ═══════════════════════════════════════════════════════
   COLOR FUNCTIONS
═══════════════════════════════════════════════════════ */

const blue = text =>
  `${COLORS.blue}${text}${RESET}`;

const cyan = text =>
  `${COLORS.cyan}${text}${RESET}`;

const brightCyan = text =>
  `${COLORS.brightCyan}${text}${RESET}`;

const green = text =>
  `${COLORS.green}${text}${RESET}`;

const brightGreen = text =>
  `${COLORS.brightGreen}${text}${RESET}`;

const yellow = text =>
  `${COLORS.yellow}${text}${RESET}`;

const red = text =>
  `${COLORS.red}${text}${RESET}`;

const brightRed = text =>
  `${COLORS.brightRed}${text}${RESET}`;

const white = text =>
  `${COLORS.white}${text}${RESET}`;

const gray = text =>
  `${COLORS.gray}${text}${RESET}`;

const magenta = text =>
  `${COLORS.magenta}${text}${RESET}`;

const brightMagenta = text =>
  `${COLORS.brightMagenta}${text}${RESET}`;

/*
 * Compatibility aliases.
 * JavaScript is case-sensitive.
 */

const brightred = brightRed;
const brightgreen = brightGreen;
const brightcyan = brightCyan;

/* ═══════════════════════════════════════════════════════
   RAINBOW ENGINE
═══════════════════════════════════════════════════════ */

const rainbowColors = [
  '\x1b[91m',
  '\x1b[93m',
  '\x1b[92m',
  '\x1b[96m',
  '\x1b[94m',
  '\x1b[95m'
];

function rainbow(text) {
  let output = '';

  for (let i = 0; i < text.length; i++) {
    output +=
      `${rainbowColors[i % rainbowColors.length]}${text[i]}`;
  }

  return `${output}${RESET}`;
}

/* ═══════════════════════════════════════════════════════
   UI
═══════════════════════════════════════════════════════ */

function line(char = '─', length = 58) {
  return char.repeat(length);
}

function header() {
  console.clear();

  console.log(
    rainbow(`
╔══════════════════════════════════════════════════════════╗
║                    ֎ XADON AI                           ║
║              PRODUCTION AUTO DEPLOYER                  ║
║                                                        ║
║          MUSTEQEEM/XADON_AI • PRODUCTION              ║
╚══════════════════════════════════════════════════════════╝
`)
  );

  console.log(
    blue(
      '              ◆ SECURE DEPLOYMENT ENGINE ◆'
    )
  );

  console.log(
    cyan(
      '                 BLUE • RAINBOW • PRO'
    )
  );

  console.log();
}

function section(title) {
  console.log();

  const remaining =
    Math.max(2, 55 - title.length);

  console.log(
    blue(
      `┌─ ${title} ${line('─', remaining)}`
    )
  );
}

function success(message) {
  console.log(
    `${brightGreen('✓')} ${green(message)}`
  );
}

function info(message) {
  console.log(
    `${brightCyan('➜')} ${brightCyan(message)}`
  );
}

function warning(message) {
  console.log(
    `${yellow('⚠')} ${yellow(message)}`
  );
}

function failure(message) {
  console.log(
    `${brightRed('✖')} ${brightRed(message)}`
  );
}

function step(number, total, message) {
  console.log(
    `${blue(`[${number}/${total}]`)} ${white(message)}`
  );
}

/* ═══════════════════════════════════════════════════════
   COMMAND EXECUTION
═══════════════════════════════════════════════════════ */

function run(
  command,
  args,
  cwd = process.cwd()
) {
  console.log();

  console.log(
    `${blue('$')} ${brightCyan(command)} ${gray(args.join(' '))}`
  );

  try {
    execFileSync(
      command,
      args,
      {
        cwd,
        stdio: 'inherit',
        env: process.env
      }
    );
  } catch (error) {
    const code =
      typeof error.status === 'number'
        ? error.status
        : 'unknown';

    throw new Error(
      `${command} command failed with exit code ${code}.`
    );
  }
}

/* ═══════════════════════════════════════════════════════
   COMMAND DETECTION
═══════════════════════════════════════════════════════ */

function exists(command) {
  try {
    if (process.platform === 'win32') {
      execFileSync(
        'where',
        [command],
        {
          stdio: 'ignore'
        }
      );
    } else {
      execFileSync(
        'sh',
        [
          '-lc',
          `command -v ${command}`
        ],
        {
          stdio: 'ignore'
        }
      );
    }

    return true;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   READLINE
═══════════════════════════════════════════════════════ */

const rl =
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY)
  });

function ask(
  question,
  fallback = ''
) {
  return new Promise(resolve => {
    rl.question(
      question,
      answer => {
        const value =
          answer.trim();

        resolve(
          value.length > 0
            ? value
            : fallback
        );
      }
    );
  });
}

/* ═══════════════════════════════════════════════════════
   ENVIRONMENT PARSER
═══════════════════════════════════════════════════════ */

function escapeEnvValue(value) {
  return String(value)
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .trim();
}

function readEnvFile() {
  const env = {};

  if (!fs.existsSync('.env')) {
    return env;
  }

  const content =
    fs.readFileSync(
      '.env',
      'utf8'
    );

  for (
    const rawLine of content.split(/\r?\n/)
  ) {
    const current =
      rawLine.trim();

    if (
      !current ||
      current.startsWith('#')
    ) {
      continue;
    }

    const index =
      current.indexOf('=');

    if (index === -1) {
      continue;
    }

    const key =
      current
        .slice(0, index)
        .trim();

    const value =
      current
        .slice(index + 1)
        .trim()
        .replace(
          /^['"]|['"]$/g,
          ''
        );

    if (key) {
      env[key] = value;
    }
  }

  return env;
}

/* ═══════════════════════════════════════════════════════
   WRITE ENVIRONMENT
═══════════════════════════════════════════════════════ */

function writeEnv(values) {
  const existing =
    readEnvFile();

  const merged = {
    ...existing,

    NODE_ENV:
      'production',

    BOT_NAME:
      values.BOT_NAME,

    OWNER_NUMBER:
      values.OWNER_NUMBER,

    PREFIX:
      values.PREFIX,

    SESSION_NAME:
      existing.SESSION_NAME ||
      'sessions',

    PORT:
      existing.PORT ||
      '3000'
  };

  const output =
    Object.entries(merged)
      .map(
        ([key, value]) =>
          `${key}=${escapeEnvValue(value)}`
      )
      .join('\n') + '\n';

  fs.writeFileSync(
    '.env',
    output,
    {
      mode: 0o600
    }
  );

  return merged;
}

/* ═══════════════════════════════════════════════════════
   LOAD ENVIRONMENT INTO PROCESS
═══════════════════════════════════════════════════════ */

function loadEnvIntoProcess() {
  const env =
    readEnvFile();

  for (
    const [key, value]
    of Object.entries(env)
  ) {
    process.env[key] = value;
  }
}

/* ═══════════════════════════════════════════════════════
   DIRECTORY CREATION
═══════════════════════════════════════════════════════ */

function ensureDirectories() {
  for (
    const directory of [
      'sessions',
      'database',
      'logs',
      'backups'
    ]
  ) {
    fs.mkdirSync(
      path.join(
        APP_DIR,
        directory
      ),
      {
        recursive: true
      }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   SAFE COPY
═══════════════════════════════════════════════════════ */

function copyDirectoryContents(
  source,
  destination
) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(
    destination,
    {
      recursive: true
    }
  );

  const entries =
    fs.readdirSync(
      source,
      {
        withFileTypes: true
      }
    );

  for (const entry of entries) {
    const sourcePath =
      path.join(
        source,
        entry.name
      );

    const destinationPath =
      path.join(
        destination,
        entry.name
      );

    if (entry.isDirectory()) {
      copyDirectoryContents(
        sourcePath,
        destinationPath
      );
    } else {
      fs.copyFileSync(
        sourcePath,
        destinationPath
      );
    }
  }
}

/* ═══════════════════════════════════════════════════════
   CREATE BACKUP
═══════════════════════════════════════════════════════ */

function createBackup() {
  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        '-'
      );

  const backupDir =
    path.join(
      APP_DIR,
      'backups',
      `autodeployer-${timestamp}`
    );

  fs.mkdirSync(
    backupDir,
    {
      recursive: true
    }
  );

  for (
    const item of [
      'sessions',
      'database'
    ]
  ) {
    const source =
      path.join(
        APP_DIR,
        item
      );

    const destination =
      path.join(
        backupDir,
        item
      );

    if (
      fs.existsSync(source)
    ) {
      fs.cpSync(
        source,
        destination,
        {
          recursive: true
        }
      );
    }
  }

  const envFile =
    path.join(
      APP_DIR,
      '.env'
    );

  if (
    fs.existsSync(envFile)
  ) {
    fs.copyFileSync(
      envFile,
      path.join(
        backupDir,
        '.env'
      )
    );
  }

  return backupDir;
}

/* ═══════════════════════════════════════════════════════
   SAFE BACKUP RESTORE
═══════════════════════════════════════════════════════ */

function restoreBackup(
  backupDir
) {
  for (
    const item of [
      'sessions',
      'database'
    ]
  ) {
    const source =
      path.join(
        backupDir,
        item
      );

    const destination =
      path.join(
        APP_DIR,
        item
      );

    if (
      !fs.existsSync(source)
    ) {
      continue;
    }

    /*
     * IMPORTANT:
     *
     * Do not remove sessions/ or database/.
     * Merge the backup contents back into the
     * existing directories.
     */

    copyDirectoryContents(
      source,
      destination
    );
  }

  const envBackup =
    path.join(
      backupDir,
      '.env'
    );

  if (
    fs.existsSync(envBackup)
  ) {
    fs.copyFileSync(
      envBackup,
      path.join(
        APP_DIR,
        '.env'
      )
    );
  }
}

/* ═══════════════════════════════════════════════════════
   SYSTEM VALIDATION
═══════════════════════════════════════════════════════ */

function validateSystem() {
  section(
    'SYSTEM CHECK'
  );

  step(
    1,
    4,
    'Checking Git...'
  );

  if (!exists('git')) {
    throw new Error(
      'Git is required but was not found.'
    );
  }

  success(
    'Git detected.'
  );

  step(
    2,
    4,
    'Checking npm...'
  );

  if (!exists('npm')) {
    throw new Error(
      'npm is required but was not found.'
    );
  }

  success(
    'npm detected.'
  );

  step(
    3,
    4,
    'Checking Node.js...'
  );

  const major =
    Number(
      process.versions.node
        .split('.')[0]
    );

  if (major < 20) {
    throw new Error(
      `Node.js 20+ required. Found ${process.version}.`
    );
  }

  success(
    `Node.js ${process.version} detected.`
  );

  step(
    4,
    4,
    'Checking deployment directory...'
  );

  success(
    `Target: ${APP_DIR}`
  );
}

/* ═══════════════════════════════════════════════════════
   UPDATE EXISTING INSTALLATION
═══════════════════════════════════════════════════════ */

function updateExistingInstallation() {
  section(
    'EXISTING INSTALLATION'
  );

  const gitDir =
    path.join(
      APP_DIR,
      '.git'
    );

  if (
    !fs.existsSync(gitDir)
  ) {
    throw new Error(
      `${APP_DIR} exists but is not an XADON Git repository.`
    );
  }

  warning(
    'Existing XADON installation detected.'
  );

  info(
    'Creating protected backup...'
  );

  const backupDir =
    createBackup();

  success(
    `Backup created: ${path.basename(
      backupDir
    )}`
  );

  process.chdir(
    APP_DIR
  );

  info(
    `Fetching ${BRANCH} from origin...`
  );

  run(
    'git',
    [
      'fetch',
      '--prune',
      'origin',
      BRANCH
    ],
    APP_DIR
  );

  info(
    `Updating from origin/${BRANCH}...`
  );

  run(
    'git',
    [
      'reset',
      '--hard',
      `origin/${BRANCH}`
    ],
    APP_DIR
  );

  info(
    'Restoring protected data...'
  );

  restoreBackup(
    backupDir
  );

  success(
    'sessions/ preserved.'
  );

  success(
    'database/ preserved.'
  );

  if (
    fs.existsSync(
      path.join(
        backupDir,
        '.env'
      )
    )
  ) {
    success(
      '.env preserved.'
    );
  }

  return backupDir;
}

/* ═══════════════════════════════════════════════════════
   FRESH INSTALLATION
═══════════════════════════════════════════════════════ */

function cloneFreshInstallation() {
  section(
    'REPOSITORY'
  );

  if (
    fs.existsSync(APP_DIR)
  ) {
    throw new Error(
      `Target directory already exists: ${APP_DIR}`
    );
  }

  info(
    `Cloning ${REPO}`
  );

  run(
    'git',
    [
      'clone',
      '--branch',
      BRANCH,
      '--single-branch',
      REPO,
      APP_DIR
    ]
  );

  if (
    !fs.existsSync(
      path.join(
        APP_DIR,
        '.git'
      )
    )
  ) {
    throw new Error(
      'Git clone completed but repository verification failed.'
    );
  }

  process.chdir(
    APP_DIR
  );

  success(
    'Repository cloned successfully.'
  );
}

/* ═══════════════════════════════════════════════════════
   BOT CONFIGURATION
═══════════════════════════════════════════════════════ */

async function configureEnvironment() {
  section(
    'BOT CONFIGURATION'
  );

  console.log(
    brightCyan(
      'Configure your XADON AI installation.'
    )
  );

  console.log(
    gray(
      'Your answers will be saved inside .env'
    )
  );

  console.log();

  const currentEnv =
    readEnvFile();

  const currentBotName =
    currentEnv.BOT_NAME ||
    '';

  const currentOwner =
    currentEnv.OWNER_NUMBER ||
    '';

  const currentPrefix =
    currentEnv.PREFIX ||
    '.';

  console.log(
    blue('֎ ') +
    white('BOT NAME')
  );

  const botName =
    await ask(
      brightCyan(
        '  ➜ Enter Bot Name: '
      ),
      currentBotName ||
      'XADON AI'
    );

  console.log();

  console.log(
    blue('◆ ') +
    white('OWNER NUMBER')
  );

  const owner =
    await ask(
      brightCyan(
        '  ➜ Enter Owner Number: '
      ),
      currentOwner
    );

  console.log();

  console.log(
    blue('◆ ') +
    white('COMMAND PREFIX')
  );

  const prefix =
    await ask(
      brightCyan(
        '  ➜ Enter Prefix: '
      ),
      currentPrefix
    );

  const values = {
    BOT_NAME:
      botName ||
      'XADON AI',

    OWNER_NUMBER:
      owner ||
      '',

    PREFIX:
      prefix ||
      '.'
  };

  writeEnv(
    values
  );

  loadEnvIntoProcess();

  console.log();

  success(
    `BOT_NAME saved as: ${values.BOT_NAME}`
  );

  success(
    `OWNER_NUMBER saved as: ${
      values.OWNER_NUMBER ||
      '(empty)'
    }`
  );

  success(
    `PREFIX saved as: ${values.PREFIX}`
  );

  console.log();

  console.log(
    gray(
      'Configuration saved securely in .env'
    )
  );
}

/* ═══════════════════════════════════════════════════════
   INSTALL DEPENDENCIES
═══════════════════════════════════════════════════════ */

function installDependencies() {
  section(
    'DEPENDENCIES'
  );

  const lockFile =
    path.join(
      APP_DIR,
      'package-lock.json'
    );

  if (
    fs.existsSync(lockFile)
  ) {
    info(
      'package-lock.json detected.'
    );

    info(
      'Installing production dependencies with npm ci...'
    );

    run(
      'npm',
      [
        'ci',
        '--omit=dev'
      ],
      APP_DIR
    );
  } else {
    warning(
      'package-lock.json not found.'
    );

    info(
      'Installing production dependencies with npm install...'
    );

    run(
      'npm',
      [
        'install',
        '--omit=dev'
      ],
      APP_DIR
    );
  }

  success(
    'Dependencies installed successfully.'
  );
}

/* ═══════════════════════════════════════════════════════
   APPLICATION VALIDATION
═══════════════════════════════════════════════════════ */

function validateApplication() {
  section(
    'APPLICATION CHECK'
  );

  const indexFile =
    path.join(
      APP_DIR,
      'index.js'
    );

  if (
    !fs.existsSync(indexFile)
  ) {
    throw new Error(
      'index.js was not found in the deployment directory.'
    );
  }

  info(
    'Checking index.js syntax...'
  );

  run(
    'node',
    [
      '--check',
      'index.js'
    ],
    APP_DIR
  );

  success(
    'index.js syntax is valid.'
  );

  console.log();

  info(
    'Running XADON doctor...'
  );

  /*
   * Doctor is diagnostic only.
   *
   * If doctor returns exit code 1,
   * deployment continues.
   */

  try {
    run(
      'npm',
      [
        'run',
        'doctor',
        '--if-present'
      ],
      APP_DIR
    );

    success(
      'XADON doctor completed successfully.'
    );
  } catch (error) {
    warning(
      'XADON doctor reported warnings.'
    );

    console.log(
      yellow(
        `⚠ ${error.message}`
      )
    );

    console.log(
      gray(
        'Doctor is diagnostic only. Deployment will continue.'
      )
    );
  }

  success(
    'Application validation completed.'
  );
}

/* ═══════════════════════════════════════════════════════
   DEPLOYMENT SUMMARY
═══════════════════════════════════════════════════════ */

function deploymentSummary() {
  section(
    'DEPLOYMENT SUMMARY'
  );

  console.log();

  console.log(
    `${blue('֎')} ${white('BOT NAME')}      : ${
      brightCyan(
        process.env.BOT_NAME ||
        'XADON AI'
      )
    }`
  );

  console.log(
    `${blue('◆')} ${white('OWNER NUMBER')} : ${
      brightCyan(
        process.env.OWNER_NUMBER ||
        '(empty)'
      )
    }`
  );

  console.log(
    `${blue('◆')} ${white('PREFIX')}       : ${
      brightCyan(
        process.env.PREFIX ||
        '.'
      )
    }`
  );

  console.log(
    `${blue('◆')} ${white('DIRECTORY')}     : ${
      brightCyan(
        APP_DIR
      )
    }`
  );

  console.log(
    `${blue('◆')} ${white('SESSION')}       : ${
      brightGreen(
        'sessions/ protected'
      )
    }`
  );

  console.log(
    `${blue('◆')} ${white('DATABASE')}      : ${
      brightGreen(
        'database/ protected'
      )
    }`
  );

  console.log(
    `${blue('◆')} ${white('.ENV')}          : ${
      brightGreen(
        'configuration saved'
      )
    }`
  );

  console.log();
}

/* ═══════════════════════════════════════════════════════
   START XADON AI
═══════════════════════════════════════════════════════ */

function startBot() {
  section(
    'STARTING XADON AI'
  );

  console.log();

  console.log(
    rainbow(
      '              ֎ XADON AI ֎'
    )
  );

  console.log(
    brightCyan(
      '        PRODUCTION ENGINE ONLINE'
    )
  );

  console.log();

  info(
    `BOT_NAME: ${
      process.env.BOT_NAME ||
      'XADON AI'
    }`
  );

  info(
    `OWNER_NUMBER: ${
      process.env.OWNER_NUMBER ||
      '(empty)'
    }`
  );

  info(
    `PREFIX: ${
      process.env.PREFIX ||
      '.'
    }`
  );

  console.log();

  const child =
    spawn(
      process.execPath,
      [
        'index.js'
      ],
      {
        cwd: APP_DIR,

        stdio: 'inherit',

        env: {
          ...process.env,

          BOT_NAME:
            process.env.BOT_NAME ||
            'XADON AI',

          OWNER_NUMBER:
            process.env.OWNER_NUMBER ||
            '',

          PREFIX:
            process.env.PREFIX ||
            '.'
        }
      }
    );

  child.on(
    'error',
    error => {
      failure(
        `Failed to start XADON AI: ${error.message}`
      );

      process.exit(1);
    }
  );

  child.on(
    'exit',
    code => {
      console.log();

      if (code === 0) {
        success(
          'XADON AI stopped normally.'
        );
      } else {
        failure(
          `XADON AI exited with code ${code}.`
        );
      }

      process.exit(
        code ?? 0
      );
    }
  );
}

/* ═══════════════════════════════════════════════════════
   SHUTDOWN
═══════════════════════════════════════════════════════ */

function shutdown() {
  console.log();

  warning(
    'Deployment interrupted.'
  );

  try {
    rl.close();
  } catch {}

  process.exit(130);
}

process.on(
  'SIGINT',
  shutdown
);

process.on(
  'SIGTERM',
  shutdown
);

/* ═══════════════════════════════════════════════════════
   MAIN ENGINE
═══════════════════════════════════════════════════════ */

async function main() {
  header();

  /* 1. SYSTEM */
  validateSystem();

  /* 2. REPOSITORY */
  if (
    fs.existsSync(APP_DIR)
  ) {
    updateExistingInstallation();
  } else {
    cloneFreshInstallation();
  }

  /* 3. DIRECTORIES */
  ensureDirectories();

  /* 4. CONFIGURATION */
  await configureEnvironment();

  /* 5. DEPENDENCIES */
  installDependencies();

  /* 6. VALIDATION */
  validateApplication();

  /* 7. SUMMARY */
  deploymentSummary();

  console.log();

  console.log(
    rainbow(
      '╔══════════════════════════════════════════════════════════╗'
    )
  );

  console.log(
    rainbow(
      '║              ✓ DEPLOYMENT COMPLETE ✓                   ║'
    )
  );

  console.log(
    rainbow(
      '╚══════════════════════════════════════════════════════════╝'
    )
  );

  console.log();

  console.log(
    brightGreen(
      '✓ sessions/ protected'
    )
  );

  console.log(
    brightGreen(
      '✓ database/ protected'
    )
  );

  console.log(
    brightGreen(
      '✓ .env protected'
    )
  );

  console.log();

  rl.close();

  startBot();
}

/* ═══════════════════════════════════════════════════════
   GLOBAL ERROR HANDLER
═══════════════════════════════════════════════════════ */

main().catch(
  error => {
    try {
      rl.close();
    } catch {}

    console.log();

    console.log(
      rainbow(
        '════════════ DEPLOYMENT ERROR ════════════'
      )
    );

    failure(
      error.message
    );

    console.log();

    console.log(
      gray(
        'No intentional deletion of the whole installation was performed.'
      )
    );

    console.log();

    process.exit(1);
  }
);
```

---
## 🛠️ Command Categories

XADON AI V2 comes with **1485+ commands** and counting. 

| Category | Examples | Description |
| --- | --- | --- |
| 🧠 **AI Intelligence** | `.ai`, `.chat`, `.imagine`, `.gemini`, `.deepseek` | GPT chat, image gen, code AI |
| ⚜️ **ADMIN** | `.kick`, `.promote`, `.antispam`, `.antilink`, `.tagall` | Full group control + defense |
| ⧬ **ANIME** | `.waifu`, `.neko`, `.shinobu`, `.cosplay` | Anime images, reactions, NSFW |
| ⧭ **ANOMALY** | `.bombdoc`, `.killgc`, `.null` | Advanced exploit tools - Owner only |
| 🎨 **ART** | `.wasted`, `.glitch`, `.rainbow`, `.hitler` | Image filters & effects |
| 🗄️ **ASSET** | `.sticker`, `.toimg`, `.togif`, `.take` | Media conversion tools |
| 🤖 **BOT** | `.menu`, `.ping`, `.uptime`, `.restart` | Bot info & system tools |
| 🏘️ **COMMUNITY** | `.cnew`, `.cgroup`, `.clink` | WhatsApp Community tools |
| ⧮ **CONVERTER** | `.ttp`, `.tovn`, `.tts`, `.fromvn` | Text to voice, video to audio |
| ֎ **CORE** | `.repo`, `.update` | Core bot functions |
| 🌚 **DEV-CENTRE** | `.get`, `.pushfolder` | Developer tools |
| 📜 **DOCUMENTS** | `.pdf`, `.excel`, `.zip`, `.chart` | File creation & conversion |
| 💎 **ECONOMY** | `.crypto`, `.forex`, `.market` | Crypto & forex data |
| ⚙️ **ENGINE** | `.backup`, `.plugins`, `.setvar` | Bot engine & system control |
| ⟁ **FETCHER** | `.yt`, `.ig`, `.tiktok`, `.fb`, `.spotify` | Download videos, music, apks |
| 🎮 **GAMES** | `.truth`, `.dare`, `.ttt`, `.wordle` | Fun games & quizzes |
| 👥 **GROUP** | `.invite`, `.hidetag`, `.lockgc` | Group management |
| 🔥 **HYPE-FUN** | `.meme`, `.quote`, `.horoscope` | Fun & entertainment |
| 🎬 **MEDIA-MODIFIER** | `.brightness`, `.glitch`, `.matrix` | Advanced media effects |
| 👑 **OWNER** | `.obf`, `.setpp`, `.mode`, `.pm2` | Owner exclusive tools |
| 🔒 **PRIVACY** | `.block`, `.unblock`, `.blist` | Privacy & security |
| 🎲 **RANDO** | `.girl`, `.car`, `.dog` | Random images |
| 🔍 **SEARCH** | `.wiki`, `.movie`, `.githubinfo` | Search anything |
| 🧰 **TOOLS** | `.calc`, `.qr`, `.short`, `.font` | Utility tools |
| ❓ **TRIVIA** | `.riddle`, `.mathquiz` | Trivia & quizzes |
| ⧉ **UTILITY** | `.tempemail`, `.url`, `.qr` | Misc utilities |
| 🎙️ **VOICE** | `.8d`, `.nightcore`, `.bass` | Voice effects |
| 💼 **WHATSAPP BUSINESS** | `.catalog`, `.labels` | Business tools |

> Type `.menu` or `.menu list` in chat for the full command list

---

⚠️ Defense Notes

1.  *Never share `sessions/` or `.env`* - contains your login keys
2.  *500 Bad Session* - V2 auto cooldowns. If it persists, re-run `node index.js`
3.  *Obfuscation* - `utils/obf.js` protects source from copy/paste theft

---

👨‍🔬 Creator

*Musteqeem*  
aka *Future Scientist*  
Building tomorrow's AI defense today 🌟  
GitHub: https://github.com/musteqeem

<div align="center">

  <img src="https://thumbs.dreamstime.com/b/futuristic-ai-brain-hologram-neon-cyber-armor-striking-d-render-glowing-artificial-intelligence-encased-sleek-emitting-436092939.jpg" width="400">

  ---
  ### ⚡ Instant Deploy
    1. Get script from `xadon.vercel.app`
    2. Upload as `index.js`
  3. Run `node index.js`
  
  *Made with passion for innovation & defense* 🛡️💙  
  _“Small daily progress builds big results.” –F𝐔𝐓𝐔𝐑𝐄 𝐒𝐂𝐈𝐄𝐍𝐓𝐈𝐒𝐓_

  ★ Star this repo if XADON protects your WhatsApp world! ★
</div>



## Command Re-engineering
The command tree has been audited and re-engineered. See `REENGINEERING_NOTES.md` for the QA report and architectural changes.

## PRO command architecture

Commands are intentionally self-contained. The current command tree does not depend on `command-pack-runtime`; small utilities and AI commands keep their input parsing, behavior, error handling, and replies inside their own `execute` function for easier auditing. Shared infrastructure is reserved for genuinely cross-cutting services rather than hiding command behavior.


---

# 🚀 XADON AI PRODUCTION DEPLOYMENT CENTER

> **New production deployment system — added without removing the original documentation above.**

XADON AI can now be deployed from the same repository on multiple hosting environments. The deployment system is designed around one rule:

### 🔐 YOUR WHATSAPP AUTHENTICATION IS PERSISTENT

The production deployers **do not intentionally delete `sessions/`**.

They also preserve:

- `sessions/`
- `database/`
- `.env`
- `backups/`

That means an update should update the **bot code**, not force you to pair your WhatsApp account again.

---

## ⚡ FASTEST POSSIBLE DEPLOY

If you already have **Node.js 20+ and Git**, you do not need to manually type `git clone`.

### Option A — Shell AutoDeployer

Run:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/autodeploy.sh)
```

This automatically:

```text
✓ checks Git
✓ checks Node.js
✓ clones XADON_AI
✓ updates an existing installation safely
✓ creates sessions/database/logs/backups
✓ preserves .env
✓ installs dependencies
✓ runs the project doctor
✓ validates index.js
✓ creates the startup helper
✓ starts XADON AI
```

### Option B — Node AutoDeployer

Upload/copy `autodeployer.js` to a machine that already has Node.js 20+ and run:

```bash
node autodeployer.js
```

It performs the same production installation flow using Node.js.

### There are TWO official AutoDeployers

| Deployer | Best for | Command |
|---|---|---|
| `autodeploy.sh` | VPS, Linux, Termux, panels with shell | `bash autodeploy.sh` |
| `autodeployer.js` | Node-based panels / manual Node deployment | `node autodeployer.js` |

`deploy.sh` is also included as a compatibility wrapper around the production shell deployer.

---

# 🧭 DEPLOYMENT METHODS

## 1. 🛡️ PTERODACTYL — NORMAL / RECOMMENDED

Pterodactyl already manages the Node process, so **PM2 is normally unnecessary**.

### Step 1 — Create a Node.js server

Use a Node.js 20+ image/egg.

### Step 2 — Startup command

Use:

```bash
cd /home/container/XADON_AI && mkdir -p sessions database logs && npm ci --omit=dev && exec node index.js
```

### Step 3 — Install the repository

Either upload the repository or use the AutoDeployer:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/autodeploy.sh)
```

### Step 4 — Start the server

Pterodactyl will keep the Node process supervised.

### Why this is recommended

```text
Pterodactyl
    │
    └── node index.js
             │
             └── XADON AI
                  │
                  └── WhatsApp session
```

Do **not** run two XADON processes against the same `sessions/` directory.

XADON includes a session lock to help detect accidental duplicate processes.

---

# 2. ⚙️ PTERODACTYL + PM2

This is supported for users who specifically want PM2 inside their environment.

### Install dependencies

```bash
npm ci
```

### Start with PM2

```bash
npx pm2 start ecosystem.config.cjs
```

or:

```bash
npm run start:pm2
```

### Check status

```bash
npx pm2 status
```

### Logs

```bash
npx pm2 logs XADON_AI
```

### Restart

```bash
npx pm2 restart XADON_AI
```

### Important

Do **not** run:

```text
Pterodactyl → node index.js
AND
PM2 → node index.js
```

at the same time for the same session.

That creates two processes trying to own one WhatsApp authentication state and can cause connection replacement/conflict.

Choose **one process supervisor**.

---

# 3. 🖥️ VPS / LINUX SERVER

### One-command deployment

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/autodeploy.sh)
```

Or:

```bash
node autodeployer.js
```

if Node.js 20+ and the deployer file are already available.

### Manual start

```bash
cd XADON_AI
node index.js
```

### PM2 start

```bash
cd XADON_AI
npm ci
npx pm2 start ecosystem.config.cjs
npx pm2 save
```

### Update

```bash
cd XADON_AI
./update.sh
```

or:

```bash
bash autodeploy.sh
```

The update process backs up persistent data before refreshing the source.

---

# 4. 📱 TERMUX

XADON AI can run on Termux on supported Android devices.

### Recommended installer

From Termux:

```bash
curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/termux-install.sh | bash
```

The installer installs the required build/runtime packages, clones XADON AI, installs dependencies, validates the project, and starts the bot.

### Manual Termux installation

```bash
pkg update -y
pkg install -y git nodejs-lts python make clang pkg-config

git clone https://github.com/musteqeem/XADON_AI.git
cd XADON_AI

npm ci --omit=dev
node index.js
```

### Start again later

```bash
cd ~/XADON_AI
node index.js
```

Keep the `sessions/` directory safe.

---

# 5. 🌐 RENDER

XADON AI includes:

```text
render.yaml
```

### Deploy

1. Create a Render account.
2. Create a new Web Service.
3. Connect your GitHub repository:
   `musteqeem/XADON_AI`
4. Let Render use `render.yaml`.

The production configuration uses:

```text
Build:
npm ci --omit=dev

Start:
npm start

Health:
 /ping
```

### Environment variables

Configure your required values in Render's environment settings rather than committing secrets.

Example:

```text
NODE_ENV=production
BOT_NAME=XADON AI
PREFIX=.
SESSION_NAME=sessions
PORT=10000
OWNER_NUMBER=your_number
```

### ⚠️ Render persistence warning

A WhatsApp authentication session is **stateful**.

Do not assume an ordinary ephemeral filesystem is a permanent home for `sessions/`.

If your Render plan/service does not provide persistent storage, a restart/redeploy can remove locally stored authentication state.

For serious 24/7 WhatsApp operation, use a deployment with reliable persistent storage or maintain a secure backup/restore workflow.

---

# 6. 🔐 SESSION / AUTH DEPLOYMENT

XADON AI's native Baileys authentication is the **`sessions/` directory**.

That directory contains authentication material and must be treated as secret.

### Moving an existing session

On the old server, archive the `sessions/` directory.

Then on the new server:

```bash
./session-import.sh /path/to/session.zip
```

Supported archive formats:

```text
.zip
.tar.gz
.tgz
```

The importer automatically creates a backup of the existing session before replacing it.

### Important distinction: "Session ID"

A random text value called `SESSION_ID` is **not automatically a Baileys authentication session**.

XADON uses the actual persisted Baileys auth state in:

```text
sessions/
```

Therefore, if a third-party service gives you a proprietary "session ID" or session string, do **not** paste it into `SESSION_ID` and assume it is a WhatsApp login.

It must be a format that XADON's authentication layer actually understands.

For a portable XADON deployment, use the supported `sessions/` archive method unless your session provider explicitly supplies a compatible auth-state format.

---

# 🔄 UPDATING WITHOUT REPAIRING WHATSAPP

After deployment:

```bash
cd XADON_AI
./update.sh
```

or:

```bash
bash autodeploy.sh
```

The deployment system:

```text
BACKUP
   ↓
FETCH LATEST SOURCE
   ↓
REFRESH APPLICATION
   ↓
RESTORE PERSISTENT DATA
   ↓
INSTALL DEPENDENCIES
   ↓
RUN DOCTOR
   ↓
VALIDATE
```

Persistent data is intentionally protected.

---

# 🩺 BUILT-IN PROJECT DOCTOR

Run:

```bash
npm run doctor
```

The doctor checks the project for common structural problems.

Also validate the main entry point:

```bash
node --check index.js
```

For a complete dependency install:

```bash
npm ci
```

---

# 🧠 PRODUCTION ARCHITECTURE

XADON AI is designed around a separated runtime model:

```text
                    ┌─────────────────────┐
                    │   GitHub Repository │
                    │ musteqeem/XADON_AI  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   AutoDeployer      │
                    │ .sh / .js           │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
        Pterodactyl          VPS               Render
             │                 │                  │
             └─────────────────┼──────────────────┘
                               │
                       ┌───────▼────────┐
                       │   XADON AI     │
                       │   Node.js      │
                       └───────┬────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
              sessions/     database/      .env
                 │
                 ▼
           WhatsApp Auth State
```

---

# 🛡️ CONNECTION SAFETY

The connection layer has been engineered to avoid the old destructive session behavior.

### The bot does NOT intentionally do this:

```js
fs.rmSync(sessionPath, {
    recursive: true,
    force: true
});
```

during normal connection recovery.

Instead:

```text
Connection failure
       ↓
Diagnose error
       ↓
Destroy socket
       ↓
Preserve authentication
       ↓
Backoff
       ↓
Create a new socket
```

The connection layer also uses a session lock to reduce accidental multi-process ownership.

### If you see "Connection Replaced"

Check that you do not have:

```text
Pterodactyl process
+
PM2 process
+
another VPS copy
+
another bot instance
```

all using the same `sessions/`.

One authentication state should have one active bot process.

---

# 🔒 SECURITY CHECKLIST

Before production:

- Never publish `.env`.
- Never publish `sessions/`.
- Never send your authentication files to strangers.
- Never commit API keys.
- Never run multiple bot instances against one session.
- Keep Node.js updated.
- Use persistent storage for production sessions.
- Back up authentication securely.
- Rotate compromised API credentials immediately.
- Do not paste secrets into GitHub issues or public logs.

---

# 🌟 WHY XADON AI IS DIFFERENT

XADON AI is not just a command collection.

It combines:

### ⚡ WhatsApp automation
Multi-device connection, messaging, groups, media and automation.

### 🧠 AI layer
AI-powered commands, model integrations and intelligent utilities.

### 🛡️ Defense layer
Group protection and administrative automation.

### 🔐 Persistent authentication
Session state is treated as application data instead of disposable temporary files.

### 🔄 Recovery architecture
Connection failures are handled with socket recovery and backoff rather than destructive session deletion.

### 🧰 Developer tooling
Project doctor, deployment scripts, update tooling and production startup helpers.

### 🚀 Multi-platform deployment
Designed for:

```text
Pterodactyl
VPS
Termux
Render
PM2
Linux
```

---

# 📋 QUICK DEPLOY TABLE

| Platform | Fastest method |
|---|---|
| 🛡️ Pterodactyl Normal | `bash <(curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/autodeploy.sh)` |
| ⚙️ Pterodactyl + PM2 | `npx pm2 start ecosystem.config.cjs` |
| 🖥️ VPS | `bash <(curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/autodeploy.sh)` |
| 📱 Termux | `curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/termux-install.sh \| bash` |
| 🌐 Render | Connect `musteqeem/XADON_AI` and use `render.yaml` |
| 📦 Existing Node server | `node autodeployer.js` |
| 🔐 Existing XADON session | Import `sessions/` with `session-import.sh` |

---

# ⭐ ONE COMMAND TO REMEMBER

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/musteqeem/XADON_AI/main/autodeploy.sh)
```

**Clone. Install. Configure. Validate. Start.**

No manual ZIP downloading.

No manual Git clone.

No rebuilding the bot from scratch every time.

Welcome to **XADON AI PRODUCTION DEPLOYMENT**. ⚡🛡️

---
