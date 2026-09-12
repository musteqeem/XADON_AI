
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
