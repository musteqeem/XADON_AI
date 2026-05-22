const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

const CONFIG = {
    repo: 'CEOcybershieldquad/XADON-AI',
    branch: 'main',
    tempDir: './.format_temp',
    backupDir: './.format_backup',
    requestTimeout: 60000
};

// Only these two items are preserved
const PRESERVE = ['sessions', '.env'];

// Safe file operations
const safeFs = {
    mkdir: dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); },
    remove: p => {
        if (!fs.existsSync(p)) return;
        const stat = fs.statSync(p);
        stat.isDirectory()? fs.rmSync(p, { recursive: true, force: true }) : fs.unlinkSync(p);
    },
    copy: (src, dest) => {
        if (!fs.existsSync(src)) return;
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            safeFs.mkdir(dest);
            for (const item of fs.readdirSync(src)) {
                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);
                if (PRESERVE.includes(item)) continue;
                safeFs.copy(srcPath, destPath);
            }
        } else {
            const destDir = path.dirname(dest);
            safeFs.mkdir(destDir);
            fs.copyFileSync(src, dest);
        }
    }
};

// Overwrite existing files with repo contents
function overwriteWithRepo(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;
    for (const item of fs.readdirSync(srcDir)) {
        const srcPath = path.join(srcDir, item);
        const destPath = path.join(destDir, item);
        if (PRESERVE.includes(item)) continue;
        if (fs.statSync(srcPath).isDirectory()) {
            safeFs.mkdir(destPath);
            overwriteWithRepo(srcPath, destPath);
        } else {
            safeFs.mkdir(path.dirname(destPath));
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

module.exports = {
    name: 'format',
    alias: ['flash', 'cleaninstall', 'factoryreset'],
    desc: 'Override bot files with latest from GitHub - XDN defense core',
    category: 'Owner',
    owner: true,
    usage: '.format confirm',
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const confirmWord = args[0]?.toLowerCase();

        if (confirmWord!== 'confirm') {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SYSTEM OVERRIDE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Target : ${CONFIG.repo}
│ ❏ Branch : ${CONFIG.branch}
│ ❏ Preserved : sessions/,.env
╰─────────────────────────╯
⚠ This will OVERWRITE all bot files

To proceed, type:.format confirm

> ֎`
            );
        }

        await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FORMAT INITIATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : BACKING UP
│ ❏ Preserved : sessions/,.env
╰─────────────────────────╯

> ֎`
        );

        try {
            // 1. Backup preserved items
            safeFs.remove(CONFIG.backupDir);
            safeFs.mkdir(CONFIG.backupDir);
            for (const item of PRESERVE) {
                if (fs.existsSync(item)) {
                    safeFs.copy(item, path.join(CONFIG.backupDir, item));
                }
            }
            await reply('│ ❏ Backup : CREATED');

            // 2. Download latest repository
            const zipUrl = `https://github.com/${CONFIG.repo}/archive/refs/heads/${CONFIG.branch}.zip`;
            const zipRes = await axios.get(zipUrl, { responseType: 'arraybuffer', timeout: CONFIG.requestTimeout });

            safeFs.remove(CONFIG.tempDir);
            safeFs.mkdir(CONFIG.tempDir);
            const zipPath = path.join(CONFIG.tempDir, 'update.zip');
            fs.writeFileSync(zipPath, zipRes.data);
            await reply('│ ❏ Download : COMPLETE');

            // 3. Extract
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(CONFIG.tempDir, true);
            await reply('│ ❏ Extract : COMPLETE');

            // 4. Overwrite current directory
            const extractedFolder = path.join(CONFIG.tempDir, `${CONFIG.repo.split('/')[1]}-${CONFIG.branch}`);
            overwriteWithRepo(extractedFolder, './');
            await reply('│ ❏ Overwrite : COMPLETE');

            // 5. Restore preserved items
            for (const item of PRESERVE) {
                const backupPath = path.join(CONFIG.backupDir, item);
                if (fs.existsSync(backupPath)) {
                    safeFs.remove(item);
                    safeFs.copy(backupPath, item);
                }
            }
            await reply('│ ❏ Restore : COMPLETE');

            // 6. Cleanup temp folders
            safeFs.remove(CONFIG.tempDir);
            safeFs.remove(CONFIG.backupDir);

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FORMAT COMPLETE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : SUCCESS
│ ❏ Preserved : sessions/,.env
╰─────────────────────────╯
Restarting in 3 seconds...

> ֎`
            );

            setTimeout(() => process.exit(0), 3000);

        } catch (err) {
            console.error('[XDN FORMAT ERROR]', err);
            try {
                for (const item of PRESERVE) {
                    const backupPath = path.join(CONFIG.backupDir, item);
                    if (fs.existsSync(backupPath)) {
                        safeFs.remove(item);
                        safeFs.copy(backupPath, item);
                    }
                }
            } catch (e) {}
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FORMAT FAILED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ERROR
│ ❏ Reason : ${err.message}
│ ❏ Action : BACKUP RESTORED
╰─────────────────────────╯

> ֎`
            );
        }
    }
};