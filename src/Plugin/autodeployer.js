const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const chalk = require('chalk');

const REPO = 'https://github.com/musteqeem/XADON_AI.git';
const FOLDER = 'XADON_AI';
const ENV_PATH = path.join(FOLDER, '.env');
const FIX_PATH = path.join(FOLDER, 'utils', 'fix.js'); // <-- CHANGED
const OBF_PATH = path.join(FOLDER, 'utils', 'obf.js'); // <-- CHANGED
const PKG_PATH = path.join(FOLDER, 'package.json');

// Fancy UI
const line = chalk.cyan('✦ ───── ⋆⋅☆⋅⋆ ───── ✦');
const header = (text) => console.log(`\n${line}\n  ${chalk.bold.magenta('֎ • ' + text)}\n${line}\n`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(chalk.yellow(q), res));

async function main() {
    console.clear();
    header(`${BOT_UI()} XADON AI ULTRA DEPLOYER ${BOT_UI()}`);

    console.log(chalk.green('👋 Welcome Boss!'));
    console.log(chalk.gray('This will clone, fix, obfuscate, setup PM2, and launch XADON AI\n'));

    // 1. CLONE REPO
    header('📦 STEP 1: CLONING REPOSITORY');
    if (fs.existsSync(FOLDER)) {
        console.log(chalk.yellow('⚠️  Folder already exists. Deleting old version...'));
        fs.rmSync(FOLDER, { recursive: true, force: true });
    }
    try {
        console.log(chalk.cyan(`🚀 Cloning from ${REPO}...`));
        execSync(`git clone ${REPO}`, { stdio: 'inherit' });
        console.log(chalk.green('✅ Clone completed successfully!'));
    } catch (e) {
        console.log(chalk.red('❌ Clone failed. Make sure git is installed'));
        process.exit(1);
    }

    // 2. RUN FIX.JS FROM UTILS
    header('🔧 STEP 2: RUNNING INTERNAL PROTOCOL FIX ON ALL FILES');
    if (!fs.existsSync(FIX_PATH)) {
        console.log(chalk.red('❌ utils/fix.js not found in repo. Skipping fix step.'));
    } else {
        try {
            console.log(chalk.cyan('⏳ Running node utils/fix.js...'));
            execSync('node utils/fix.js', { cwd: FOLDER, stdio: 'inherit' }); // <-- CHANGED
            console.log(chalk.green('✅ All files fixed!'));
        } catch (e) {
            console.log(chalk.red('❌ fix.js failed. Check the errors above'));
            process.exit(1);
        }
    }

    // 2.5 RUN OBF.JS FROM UTILS
    header('🔒 STEP 2.5: ACTIVATING FIREWALLS DEFENSE SHIELD');
    if (!fs.existsSync(OBF_PATH)) {
        console.log(chalk.red('❌ utils/obf.js not found in repo. Skipping obfuscation.'));
    } else {
        try {
            console.log(chalk.cyan('⏳ Running node utils/obf.js... This may take 1-2 mins'));
            execSync('node utils/obf.js', { cwd: FOLDER, stdio: 'inherit' }); // <-- CHANGED
            console.log(chalk.green('✅ Obfuscation completed!'));
        } catch (e) {
            console.log(chalk.red('❌ obf.js failed. Check the errors above'));
            process.exit(1);
        }
    }

    // 3. SWITCH START COMMAND BACK TO index.js
    header('🔄 STEP 3: RESETTING START COMMAND');
    if (fs.existsSync(PKG_PATH)) {
        let pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
        if (pkg.scripts && pkg.scripts.start) {
            pkg.scripts.start = 'node index.js';
            fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2));
            console.log(chalk.green(`✅ package.json start script set to: ${pkg.scripts.start}`));
        } else {
            console.log(chalk.yellow('⚠️  No start script found in package.json'));
        }
    }

    // 4. INSTALL DEPS
    header('📚 STEP 4: INSTALLING DEPENDENCIES + PM2');
    console.log(chalk.cyan('⏳ Running npm install... this may take 2-3 mins'));
    try {
        execSync('npm install', { cwd: FOLDER, stdio: 'inherit' });
        console.log(chalk.cyan('⏳ Installing PM2 globally...'));
        execSync('npm i -g pm2', { stdio: 'inherit' });
        console.log(chalk.green('✅ Dependencies + PM2 installed!'));
    } catch (e) {
        console.log(chalk.red('❌ npm install failed'));
        process.exit(1);
    }

    // 5. COLLECT BOT DETAILS
    header('⚙️ STEP 5: BOT CONFIGURATION');
    
    let botName = await ask('🤖 Enter Your Bot Name: ');
    botName = botName.trim() || 'XADON AI';
    
    let ownerNumber = await ask('📱 Enter Owner Number with country code: ');
    ownerNumber = ownerNumber.trim() || '2347079056039';
    
    let prefix = await ask('⌨️  Enter Command Prefix [default: .]: ');
    prefix = prefix.trim() || '.';

    // 6. WRITE .env
    header('📝 STEP 6: CREATING .env FILE');
    const envData = `BOT_NAME=${botName}
OWNER_NUMBER=${ownerNumber}
PREFIX=${prefix}
SESSION_ID=
`;
    fs.writeFileSync(ENV_PATH, envData);
    console.log(chalk.green('✅ .env created successfully!'));
    console.log(chalk.gray(`   BOT_NAME: ${botName}`));
    console.log(chalk.gray(`   OWNER_NUMBER: ${ownerNumber}`));
    console.log(chalk.gray(`   PREFIX: ${prefix}`));

    rl.close();

    // 7. SETUP PM2 + LAUNCH BOT
    header(`🚀 STEP 7: LAUNCHING ${botName} WITH PM2`);
    console.log(chalk.cyan('⏳ Killing old PM2 process if any...'));
    try { execSync('pm2 delete XADON_AI', { stdio: 'ignore' }); } catch {}
    
    console.log(chalk.cyan('⏳ Starting bot with PM2...'));
    try {
        execSync(`pm2 start npm --name "XADON_AI" -- start`, { cwd: FOLDER, stdio: 'inherit' });
        execSync('pm2 save', { stdio: 'inherit' });
        console.log(chalk.green('✅ Bot is now running on PM2!'));
        console.log(chalk.gray('💡 Use: pm2 logs XADON_AI | pm2 restart XADON_AI | pm2 status'));
    } catch (e) {
        console.log(chalk.red('❌ PM2 start failed'));
        process.exit(1);
    }

    header('✅ DEPLOYMENT COMPLETE');
    console.log(chalk.green(`Your bot ${botName} is now running 24/7`));
    console.log(chalk.yellow('⚠️  To make PM2 start on server reboot, run this once manually:'));
    console.log(chalk.cyan('pm2 startup'));
}

function BOT_UI() {
    return '𖣘'
}

main().catch(err => {
    console.error(chalk.red('Fatal error:'), err);
    process.exit(1);
});