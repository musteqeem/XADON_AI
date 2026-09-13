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
