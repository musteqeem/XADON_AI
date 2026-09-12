const fetch = require('node-fetch');
const PM2 = require('../../../utils/pm2.js');

module.exports = {
    name: 'pm2',
    alias: ['p2'],
    category: 'Owner',
    owner: true,
    group: false,

    execute: async (sock, m, { args, reply }) => {
        try {
            const action = args[0]?.toLowerCase();

            if(!action) {
                let menu = `𖣘 *PM2 + BOT CONTROL PANEL* 𖣘
*19 COMMANDS AVAILABLE*

*BASIC*
.ppm2 start - Start bot
.ppm2 restart - Restart bot
.ppm2 stop - Stop bot
.ppm2 delete - Delete from PM2
.ppm2 reload - 0 downtime restart

*MONITOR*
.ppm2 status - Show all processes
.ppm2 describe - Bot details + RAM
.ppm2 logs [100] - Show logs
.ppm2 logs error - Show only errors
.ppm2 monit - Live dashboard
.ppm2 flush - Clear logs

*SYSTEM*
.ppm2 save - Save processes
.ppm2 startup - Auto start on reboot
.ppm2 reset - Reset crash count
.ppm2 ping - Check PM2 daemon

*BOT TOOLS*
.ppm2 update - Git pull + npm i + fix + reload
.ppm2 backup - Backup session + src
.ppm2 scan - Scan for missing files
.ppm2 fix file.js old new - Smart replace
.ppm2 run [cmd] - Run any pm2 command

Example:.pm2 fix index.js doctenv guy`;
                return reply(menu);
            }

            await reply(`⏳ Running: pm2 ${action}...`);

            switch(action) {
                case 'start': PM2.start(); break;
                case 'restart': PM2.restart(); break;
                case 'stop': PM2.stop(); break;
                case 'delete': PM2.delete(); break;
                case 'reload': PM2.reload(); break;
                case 'status': PM2.status(); break;
                case 'describe': PM2.describe(); break;
                case 'monit': PM2.monit(); break;

                case 'logs':
                    if(args[1] === 'error') {
                        // SHOW ONLY ERRORS
                        PM2.run(`pm2 logs ${"XADON_AI"} --err --lines 100`);
                    } else {
                        PM2.logs(args[1] || 100);
                    }
                    break;

                case 'flush': PM2.flush(); break;
                case 'kill': PM2.kill(); break;
                case 'save': PM2.save(); break;
                case 'resurrect': PM2.resurrect(); break;
                case 'updatepm2': PM2.updatepm2(); break;
                case 'startup': PM2.startup(); break;
                case 'unstartup': PM2.unstartup(); break;
                case 'reset': PM2.reset(); break;
                case 'ping': PM2.ping(); break;
                case 'update': PM2.update(); break;
                case 'backup': PM2.backup(); break;
                case 'scan': PM2.scan(); break;

                case 'fix':
                    const [file, oldText,...newArr] = args.slice(1);
                    const newText = newArr.join(' ');
                    if(!file ||!oldText ||!newText) return reply('Usage:.pm2 fix index.js doctenv guy');
                    PM2.smartfix(file, oldText, newText);
                    break;

                case 'run': PM2.run(args.slice(1).join(' ')); break;
                default: return reply('❌ Invalid pm2 command. Use.pm2 to see list');
            }
            await reply(`✅ Done: pm2 ${action}`);
        } catch (e) {
            console.error('PM2 ERROR:', e);
            reply(`𓄁 Error: ${e.message}`);
        }
    }
};