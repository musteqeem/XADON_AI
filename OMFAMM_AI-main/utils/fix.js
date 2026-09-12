const fs = require('fs');
const path = require('path');

/**
 * Safe project fixer.
 *
 * Only applies deterministic local-import corrections that are known to be
 * safe. It never rewrites command behavior or fabricates missing modules.
 */

const ROOT = path.join(__dirname, '..');
const fixes = [
    {
        file: path.join(ROOT, '?.js'),
        from: "require('./src/Commands/Admin/Mute.js')",
        to: "require('./src/Commands/Admin/mute.js')"
    },
    {
        file: path.join(ROOT, 'src', 'Plugin', 'config.js'),
        from: "require('../src/Plugin/configManager')",
        to: "require('./configManager')"
    },
    {
        file: path.join(ROOT, 'src', 'Commands', 'Bot', 'xdnMsg.js'),
        from: "require('../../settings/config')",
        to: "require('../../../settings/config')"
    },
    {
        file: path.join(ROOT, 'src', 'Commands', 'Engine', 'stats.js'),
        from: "require('../Plugin/statusHandler')",
        to: "require('../../Plugin/statusHandler')"
    }
];

let changed = 0;

for (const fix of fixes) {
    if (!fs.existsSync(fix.file)) continue;

    const source = fs.readFileSync(fix.file, 'utf8');
    if (!source.includes(fix.from)) continue;

    const updated = source.split(fix.from).join(fix.to);
    fs.writeFileSync(fix.file, updated);
    changed++;
    console.log(`✓ Fixed ${path.relative(ROOT, fix.file)}: ${fix.from} → ${fix.to}`);
}

console.log(`\n✓ Safe fixes applied: ${changed}`);
console.log('✓ No wildcard/non-existent replacement paths are generated.');
