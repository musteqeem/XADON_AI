const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

let obf = 0;
let skipped = 0;

const options = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.9,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    identifierNamesPrefix: 'a0_0x',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    renameProperties: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: ['rc4'],
    stringArrayThreshold: 1,
    transformObjectKeys: false,
    unicodeEscapeSequence: false
};

// Detect if file is already obfuscated like your example
function isAlreadyObfuscated(code) {
    return /function a0_0x[a-f0-9]{4}\(\)/.test(code) ||  // has a0_0x function
           /while\(!!\[\]\)\{try/.test(code) ||            // has control flow flattening
           /return _0x[a-f0-9]{4}\[\_0x[a-f0-9]{4}\-\d+\]/.test(code) || // string array decoder
           /_0x[a-f0-9]{4}\(\d+\)/.test(code);             // already using _0x(0x123)
}

function obfFolder(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            obfFolder(fullPath);
        } else if (file.endsWith('.js')) {
            let data = fs.readFileSync(fullPath, 'utf8');
            
            if (isAlreadyObfuscated(data)) {
                console.log('Skipped Already Obf:', fullPath);
                skipped++;
                return;
            }
            
            try {
                const result = JavaScriptObfuscator.obfuscate(data, options);
                fs.writeFileSync(fullPath, result.getObfuscatedCode());
                console.log('Obfuscated:', fullPath);
                obf++;
            } catch (err) {
                console.log('Error:', fullPath, err.message);
            }
        }
    });
}

console.log('Starting obfuscation...');
obfFolder('./src/Commands');
console.log(`\n✅ Done\nObfuscated: ${obf} files\nSkipped: ${skipped} already obf files`);