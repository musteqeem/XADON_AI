const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

function readFileSafe(file) {
    try {
        return fs.readFileSync(file, "utf8");
    } catch {
        return null;
    }
}

function writeFileSafe(file, content) {
    fs.writeFileSync(file, content);
}

function listDir(dir) {
    try {
        return fs.readdirSync(dir).join("\n");
    } catch {
        return "❌ Cannot access directory";
    }
}

// Recursively get all.js files
function getJSFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of list) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(getJSFiles(fullPath));
        } else if (entry.isFile() && fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

function obfuscateFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(code, 'utf8');

    const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 1,
        debugProtection: true,
        debugProtectionInterval: 4000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        identifiersPrefix: '',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 3,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 1,
        stringArrayEncoding: ['rc4'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 5,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 5,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 1,
        transformObjectKeys: true,
        unicodeEscapeSequence: true,
        renameProperties: false,
        reservedNames: ['module', 'exports', 'require', 'name', 'execute'],
        target: 'node'
    }).getObfuscatedCode();

    fs.writeFileSync(filePath, obfuscated, 'utf8');
    const newSize = Buffer.byteLength(obfuscated, 'utf8');
    return { originalSize, newSize };
}

module.exports = {
    name: "innerxdn",
    alias: ["godcore"],
    category: "musteqeem",
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0];
        const input = args.slice(1).join(" ");
        const jid = m.chat;

        if (!sub) {
            return reply(`
╔═══『 ⚡ XADON GOD CORE ⚡ 』═══╗
┃ 📂 read <path>
┃ 📝 write <path> <text>
┃ 🗑 delete <path>
┃ 📁 mkdir <path>
┃ 📑 ls <path>
┃ 🔁 move <from> <to>
┃ 📊 scan <dir>
┃ 🔒 obf <path> - Obfuscate file or entire directory
╚══════════════╝
            `);
        }

        // 📂 READ FILE
        if (sub === "read") {
            const data = readFileSafe(input);
            if (!data) return reply("❌ File not found");
            return reply("📂 FILE CONTENT:\n\n" + data.slice(0, 4000));
        }

        // 📝 WRITE FILE
        if (sub === "write") {
            const [file,...textArr] = args.slice(1);
            const text = textArr.join(" ");
            if (!file ||!text) return reply("❌ Usage:.xdn write path text");
            writeFileSafe(file, text);
            return reply("✅ File written successfully");
        }

        // 🗑 DELETE FILE
        if (sub === "delete") {
            if (!fs.existsSync(input)) return reply("❌ File not found");
            fs.unlinkSync(input);
            return reply("🗑 File deleted");
        }

        // 📁 CREATE FOLDER
        if (sub === "mkdir") {
            fs.mkdirSync(input, { recursive: true });
            return reply("📁 Folder created");
        }

        // 📑 LIST DIRECTORY
        if (sub === "ls") {
            return reply("📂 DIRECTORY:\n\n" + listDir(input || "./"));
        }

        // 🔁 MOVE FILE
        if (sub === "move") {
            const [from, to] = args.slice(1);
            if (!from ||!to) return reply("❌ Usage:.xdn move from to");
            fs.renameSync(from, to);
            return reply("🔁 File moved");
        }

        // 📊 SCAN PROJECT
        if (sub === "scan") {
            const dir = input || "./";
            const files = fs.readdirSync(dir, { withFileTypes: true });
            let out = "📊 PROJECT SCAN:\n\n";
            files.forEach(f => {
                out += (f.isDirectory()? "📁 " : "📄 ") + f.name + "\n";
            });
            return reply(out);
        }

        // 🔒 OBFUSCATE FILE OR DIRECTORY IN-PLACE
        if (sub === "obf") {
            const targetPath = input;
            if (!targetPath) return reply("❌ Usage:.xdn obf <path/to/file.js or dir>");
            if (!fs.existsSync(targetPath)) return reply("❌ Path not found");

            await sock.sendMessage(m.chat, { react: { text: '🔒', key: m.key } });

            try {
                let filesToObfuscate = [];

                if (fs.statSync(targetPath).isDirectory()) {
                    filesToObfuscate = getJSFiles(targetPath);
                    if (filesToObfuscate.length === 0) {
                        return reply("❌ No.js files found in directory");
                    }
                } else {
                    if (!targetPath.endsWith('.js')) return reply("❌ Only.js files supported");
                    filesToObfuscate = [targetPath];
                }

                let totalOriginal = 0;
                let totalNew = 0;
                let failed = 0;

                for (const file of filesToObfuscate) {
                    try {
                        const { originalSize, newSize } = obfuscateFile(file);
                        totalOriginal += originalSize;
                        totalNew += newSize;
                    } catch (err) {
                        failed++;
                        console.error(`Failed to obfuscate ${file}:`, err.message);
                    }
                }

                await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
*֎ • MAX OBFUSCATION DONE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

📁 Target: ${targetPath}
📄 Files processed: ${filesToObfuscate.length - failed}/${filesToObfuscate.length}
📊 Total Size: ${(totalOriginal/1024).toFixed(1)}KB → ${(totalNew/1024).toFixed(1)}KB

🔒 RC4 + Control Flow 100%
🔒 Self Defending + Debug Protection
🔒 Overwritten in-place

⚠️ Original code is now obfuscated
> ֎`);

            } catch (err) {
                await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return reply(`❌ Obfuscation failed: ${err.message}\n\nRun: npm install javascript-obfuscator\n> ֎`);
            }
        }

        return reply("❌ Unknown subcommand. Use `.xdn` to see list");
    }
};