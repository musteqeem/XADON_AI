const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const APP_NAME = "XADON_AI";
const ROOT = path.join(__dirname, '..'); // XADON_AI root

const PM2 = {
    // 1. BASIC CONTROL
    start: () => execSync(`pm2 start npm --name "${APP_NAME}" --max-memory-restart 500M --exp-backoff 3000 -- start`, { cwd: ROOT, stdio: 'inherit' }),
    restart: () => execSync(`pm2 restart ${APP_NAME}`, { stdio: 'inherit' }),
    stop: () => execSync(`pm2 stop ${APP_NAME}`, { stdio: 'inherit' }),
    delete: () => execSync(`pm2 delete ${APP_NAME}`, { stdio: 'inherit' }),
    reload: () => execSync(`pm2 reload ${APP_NAME}`, { stdio: 'inherit' }),

    // 2. MONITORING
    status: () => execSync(`pm2 status`, { stdio: 'inherit' }),
    describe: () => execSync(`pm2 describe ${APP_NAME}`, { stdio: 'inherit' }),
    monit: () => spawn('pm2', ['monit'], { stdio: 'inherit' }),
    logs: (lines = 100) => execSync(`pm2 logs ${APP_NAME} --lines ${lines} --timestamp`, { stdio: 'inherit' }),
    flush: () => execSync(`pm2 flush`, { stdio: 'inherit' }),

    // 3. SYSTEM
    kill: () => execSync(`pm2 kill`, { stdio: 'inherit' }),
    save: () => execSync(`pm2 save`, { stdio: 'inherit' }),
    resurrect: () => execSync(`pm2 resurrect`, { stdio: 'inherit' }),
    updatepm2: () => execSync(`pm2 update`, { stdio: 'inherit' }),
    startup: () => execSync(`pm2 startup`, { stdio: 'inherit' }),
    unstartup: () => execSync(`pm2 unstartup`, { stdio: 'inherit' }),
    reset: () => execSync(`pm2 reset ${APP_NAME}`, { stdio: 'inherit' }),
    ping: () => execSync(`pm2 ping`, { stdio: 'inherit' }),

    // 4. AUTO UPDATE
    update: () => {
        console.log(chalk.cyan('⏳ STEP 1: Git Pull...'));
        execSync(`git pull`, { cwd: ROOT, stdio: 'inherit' });
        console.log(chalk.cyan('⏳ STEP 2: NPM Install...'));
        execSync(`npm install`, { cwd: ROOT, stdio: 'inherit' });
        console.log(chalk.cyan('⏳ STEP 3: Running fix + obf...'));
        if(fs.existsSync(path.join(ROOT, 'utils', 'fix.js'))) execSync(`node utils/fix.js`, { cwd: ROOT, stdio: 'inherit' });
        if(fs.existsSync(path.join(ROOT, 'utils', 'obf.js'))) execSync(`node utils/obf.js`, { cwd: ROOT, stdio: 'inherit' });
        console.log(chalk.cyan('⏳ STEP 4: PM2 Reload...'));
        execSync(`pm2 reload ${APP_NAME}`, { stdio: 'inherit' });
        console.log(chalk.green('✅ UPDATE COMPLETE!'));
    },

    // 5. BACKUP - FIXED
    backup: () => {
        const date = new Date().toISOString().slice(0,10);
        const zipName = `XADON_BACKUP_${date}.zip`;
        console.log(chalk.cyan(`⏳ Backing up session + src to ${zipName}...`));
        execSync(`zip -r ${zipName} session src .env package.json`, { cwd: ROOT, stdio: 'inherit' }); // FIXED HERE
        console.log(chalk.green(`✅ Backup saved: ${zipName}`));
    },

    // 6. SCAN MISSING FILES
    scan: () => {
        console.log(chalk.cyan('⏳ Scanning all require() in bot...'));
        execSync(`node utils/check-and-fix.js`, { cwd: ROOT, stdio: 'inherit' });
    },

    // 7. SMART FIX:.pm2 fix file.js old new
    smartfix: (file, oldText, newText) => {
        const filePath = path.join(ROOT, file);
        if(!fs.existsSync(filePath)) throw new Error(`File not found: ${file}`);

        let data = fs.readFileSync(filePath, 'utf8');
        const regex = new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'); // escape
        const newData = data.replace(regex, newText);

        if(data === newData) throw new Error(`Text "${oldText}" not found in ${file}`);

        fs.writeFileSync(filePath, newData);
        console.log(chalk.green(`✅ Fixed: Replaced "${oldText}" with "${newText}" in ${file}`));

        // auto reload after fix
        execSync(`pm2 reload ${APP_NAME}`, { stdio: 'inherit' });
    },

    // 8. RUN ANY CMD
    run: (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
}

module.exports = PM2;