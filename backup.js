// backup.js - Auto backup sessions every 3 days
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const SESSIONS_DIR = path.join(__dirname, 'sessions');
const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS = 5; // Keep only last 5 backups

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

function createBackup() {
    if (!fs.existsSync(SESSIONS_DIR)) {
        console.log('[BACKUP] sessions folder not found. Skipping.');
        return;
    }

    const date = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupName = `sessions-${date}-${time}.zip`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`[BACKUP] ✅ Created: ${backupName} - ${archive.pointer()} bytes`);
        cleanupOldBackups();
    });

    archive.on('error', (err) => console.error('[BACKUP] Error:', err));
    archive.pipe(output);
    archive.directory(SESSIONS_DIR, false);
    archive.finalize();
}

function cleanupOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
       .filter(f => f.startsWith('sessions-') && f.endsWith('.zip'))
       .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
       .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
        files.slice(MAX_BACKUPS).forEach(f => {
            fs.unlinkSync(path.join(BACKUP_DIR, f.name));
            console.log(`[BACKUP] 🗑️ Deleted old: ${f.name}`);
        });
    }
}

// Run backup every 3 days = 259200000 ms
setInterval(createBackup, 259200000);
createBackup(); // Run once on start

console.log('[BACKUP] Auto backup started. Will backup every 3 days.');