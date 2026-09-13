const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, '?.js');

console.log('⎙ [XADON CHECKER] Verifying local imports...\n');

const missing = [];
const found = [];
const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveLocal(fromFile, request) {
    const base = path.resolve(path.dirname(fromFile), request);
    const candidates = [
        base,
        `${base}.js`,
        `${base}.json`,
        path.join(base, 'index.js')
    ];
    return candidates.find(file => fs.existsSync(file));
}

function walk(dir) {
    const result = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
            result.push(...walk(full));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            result.push(full);
        }
    }
    return result;
}

for (const file of walk(ROOT).filter(file => !file.endsWith(path.join('utils', 'fix.js')) && !file.endsWith(path.join('utils', 'checker.js')))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(requireRegex)) {
        const request = match[1];
        if (!request.startsWith('.')) continue;
        const resolved = resolveLocal(file, request);
        if (resolved) found.push([file, request]);
        else missing.push([file, request]);
    }
}

for (const [file, request] of missing) {
    console.log(`[MISS] ${path.relative(ROOT, file)} -> ${request}`);
}

console.log(`\n✅ Found local imports: ${found.length}`);
console.log(`❌ Missing local imports: ${missing.length}`);

if (missing.length === 0) {
    console.log('🚀 Local import check passed.');
} else {
    console.log('⚠️ Fix the missing local imports before deployment.');
    process.exitCode = 1;
}
