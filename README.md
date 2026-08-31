
<div align="center">

 # 🌌 𝐗𝐀𝐃𝐎𝐍 𝐀𝐈 𝐕2 – Ultra Defense + Main Core 🛡️⚡

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
1. `📦 Clone` the latest XADON_AI repo
2. `🔧 Fix` all files with `utils/fix.js`
3. `🔒 Obfuscate` with `utils/obf.js` - Defense Shield ON
4. `📚 npm install` + `pm2` install
5. `⚙️ Ask` for Bot Name, Owner Number, Prefix
6. `📝 Create .env`
7. `🚀 Launch` bot with PM2 24/7

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
const header = (text) => console.log(`\n${line}\n ${chalk.bold.magenta('֎ • ' + text)}\n${line}\n`);

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
 let prefix = await ask('⌨️ Enter Command Prefix [default: .]: ') || '.';

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

1. *Never share `sessions/` or `.env`* - contains your login keys
2. *500 Bad Session* - V2 auto cooldowns. If it persists, re-run `node index.js`
3. *Obfuscation* - `utils/obf.js` protects source from copy/paste theft

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