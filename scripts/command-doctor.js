#!/usr/bin/env node

/**
 * Dependency-free static health check for the command tree.
 * Run with: npm run doctor
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', 'src', 'Commands');
const files = walk(ROOT).filter(file => file.endsWith('.js'));

let syntaxErrors = 0;
let metadataWarnings = 0;
let secretWarnings = 0;
const names = new Map();

for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    try {
        new vm.Script(source, { filename: file });
    } catch (error) {
        syntaxErrors++;
        console.error(`❌ Syntax: ${relative(file)}\n${error.message}`);
    }

    const name = source.match(/\bname\s*:\s*['"]([^'"]+)['"]/i)?.[1];
    const hasExecute = /\bexecute\s*(?:[:=]|\([^)]*\)\s*\{)/.test(source);
    const isWrapper = /\.\.\.(?:target|anti\w+|defense)/.test(source);
    const isHelper = /module\.exports\.(?:handle|setup|load|save|get|set|is|norm|MARKER|mentionConfig|emojiCmds|stickerCmds)\s*=/.test(source);

    if (name && !hasExecute && !isWrapper && !isHelper) {
        metadataWarnings++;
        console.warn(`⚠️  No execute handler: ${relative(file)}`);
    }

    if (name) {
        const key = name.toLowerCase();
        if (!names.has(key)) names.set(key, []);
        names.get(key).push(relative(file));
    }

    if (/gsk_[A-Za-z0-9]+|AIzaSy[A-Za-z0-9_-]+|YOUR_(?:API|GOOGLE)|api\.your-ai-provider|Bearer musteqeem/i.test(source)) {
        secretWarnings++;
        console.error(`❌ Possible hard-coded credential: ${relative(file)}`);
    }
}

const duplicateNames = [...names.entries()].filter(([, list]) => list.length > 1);

console.log('');
console.log('╭─ XADON COMMAND DOCTOR');
console.log(`│ Files checked : ${files.length}`);
console.log(`│ Syntax errors : ${syntaxErrors}`);
console.log(`│ Metadata warn : ${metadataWarnings}`);
console.log(`│ Secret warn   : ${secretWarnings}`);
console.log(`│ Duplicate names: ${duplicateNames.length}`);
console.log('╰────────────────────────');

for (const [name, list] of duplicateNames) {
    console.log(`• ${name}: ${list.join(' | ')}`);
}

process.exitCode = syntaxErrors || secretWarnings ? 1 : 0;

function walk(dir) {
    const result = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) result.push(...walk(full));
        else result.push(full);
    }
    return result;
}

function relative(file) {
    return path.relative(path.join(__dirname, '..'), file);
}
