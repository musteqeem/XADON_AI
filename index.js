require('dotenv').config(); // LINE 1
global.BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // LINE 2
/*
 XADON ULTRA DEFENSE BOT ENTRY.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// -------------------------------------------------------------------
// 1. Check if auto-update is enabled
// -------------------------------------------------------------------
const CONFIG_PATH = path.join(process.cwd(), 'database', 'autoupdate.json');
let autoUpdateEnabled = false;

try {
    if (fs.existsSync(CONFIG_PATH)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        autoUpdateEnabled = config.enabled === true;
    }
} catch (err) {
    console.error(chalk.red('[AUTO-UPDATE] Failed to read config:'), err.message);
}

// -------------------------------------------------------------------
// 2. If enabled, run the update and WAIT for it to finish
// -------------------------------------------------------------------
(async () => {

    if (autoUpdateEnabled) {
        console.log(chalk.yellow(`֎ XADON AI updating...ⓘ`));
        console.log(chalk.cyan(`⎙ [XADON AI] —͟͟͞͞𖣘֎ Starting update (blocking startup)...`));

        const { performUpdate } = require('./src/Plugin/updater.js');

        try {
            const result = await performUpdate({ notifyOwner: null });
            if (result.success) {
                console.log(chalk.green(`✓ [XADON AI] Background update completed successfully.`));
                console.log(chalk.cyan(`⎙ XADON AI—͟͟͞͞𖣘❚ Changes applied BE READY FOR FULL DEFENSE.`));
            } else {
                console.log(chalk.red(`✘ [XADON AI] Background update failed:`), result.error);
            }
        } catch (err) {
            console.error(chalk.red(`✘ [XADON AI] Background update error:`), err);
        }
    } else {
        console.log(chalk.gray('ⓘ Auto-update is disabled. Skipping.'));
    }

    // -------------------------------------------------------------------
    // 3. Load and start main bot
    // -------------------------------------------------------------------
    console.log(chalk.cyan(`⎙ [XADON AI] LOADING MAIN ULTRA DEFENSE BOT 𖣘...`));
    console.log(chalk.green(`✅ BOT_NAME loaded: ${global.BOT_NAME}`))
    require('./֎.js');

    // MEMORY + ANTI CRASH FIX
    // Force garbage collection every 5 minutes. Run with: node --expose-gc index.js
    setInterval(() => { if(global.gc) global.gc() }, 300000);

    // Don't exit on error. Let ֎.js handle reconnect
    process.on('uncaughtException', (err) => {
        console.log(chalk.red('[ERROR] uncaughtException:'), err.message);
    });
    process.on('unhandledRejection', (err) => {
        console.log(chalk.red('[ERROR] unhandledRejection:'), err.message);
    });

})();