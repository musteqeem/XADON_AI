// © 2026 MUSTEQEEM.. All Rights Reserved.
// respect the work, don't just copy-paste
//No longer need all konek create socket are already implemented in ֎.js. @musteqeem Fix 29/8/26

const chalk = require("chalk")

let reconnectAttempts = 0;
const MAX_RECONNECT = 10; // prevent infinite loop

module.exports = {
    konek: async ({ sock, update, clientstart, DisconnectReason, Boom }) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

            console.log(chalk.red(`❌ Connection closed. Reason: ${reason}`));

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bold.red('🚫 Logged out. Delete session folder and restart.'));
                process.exit(1);
            }

            if (reason === DisconnectReason.connectionReplaced) {
                console.log(chalk.bold.red('⚠️ Connection replaced. Another session opened. Exiting...'));
                process.exit(1);
            }

            if (reason === DisconnectReason.badSession) {
                console.log(chalk.bold.red('❌ Bad session. Delete session folder and re-pair.'));
                process.exit(1);
            }

            // SAFE RECONNECT WITH BACKOFF
            reconnectAttempts++;
            if (reconnectAttempts > MAX_RECONNECT) {
                console.log(chalk.red('⚠️ Too many reconnect attempts. Restarting process...'));
                process.exit(1); // Let PM2 restart it fresh
            }

            const delay = Math.min(5000 * reconnectAttempts, 30000); // 5s, 10s, 15s... max 30s
            console.log(chalk.yellow(`🔄 Reconnecting in ${delay/1000}s... Attempt ${reconnectAttempts}/${MAX_RECONNECT}`));
            
            // Clean up old socket to prevent memory leak
            try { await sock.end(); } catch(e){}
            sock.ev.removeAllListeners();
            
            setTimeout(() => {
                clientstart().catch(err => {
                    console.log(chalk.red('[RECONNECT ERROR]', err.message));
                });
            }, delay);

        } else if (connection === "open") {
            reconnectAttempts = 0; // reset counter on success
            console.log(chalk.bold.green('✓ Bot connected successfully'));
            console.log(chalk.gray(`Uptime: ${new Date().toLocaleString()}`));
        }
    }
}

//library/connection/connection.js kept for future use