const fs = require("fs");
const path = require("path");

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

module.exports = {
    name: "xdn",
    alias: ["godcore"],
    category: "group",
    owner: true,

    execute: async (sock, m, { args, reply }) => {

        const sub = args[0];
        const input = args.slice(1).join(" ");
        const jid = m.chat;

        if (!sub) {
            return reply(`
╔═══『 ⚡ XADON GOD CORE ⚡ 』═══╗
┃ 📂 file read <path>
┃ 📝 file write <path> <text>
┃ 📁 file delete <path>
┃ 📂 mkdir <path>
┃ 📑 ls <path>
┃ 🔁 move <from> <to>
┃ 📊 scan <dir>
╚══════════════════════╝
            `);
        }

        // 📂 READ FILE
        if (sub === "read") {
            const data = readFileSafe(input);
            if (!data) return reply("❌ File not found");
            return reply("📂 FILE CONTENT:\n\n" + data.slice(0, 50000));
        }

        // 📝 WRITE FILE
        if (sub === "write") {
            const [file, ...textArr] = args.slice(1);
            const text = textArr.join(" ");
            if (!file || !text) return reply("❌ Usage: file write path text");

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
            if (!from || !to) return reply("❌ Usage: move from to");

            fs.renameSync(from, to);
            return reply("🔁 File moved");
        }

        // 📊 SCAN PROJECT
        if (sub === "scan") {
            const dir = input || "./";
            const files = fs.readdirSync(dir, { withFileTypes: true });

            let out = "📊 PROJECT SCAN:\n\n";
            files.forEach(f => {
                out += (f.isDirectory() ? "📁 " : "📄 ") + f.name + "\n";
            });

            return reply(out);
        }

        return reply("❌ Unknown command");
    }
};