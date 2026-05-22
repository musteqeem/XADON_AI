const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const OWNER = "musteqeem";
const REPO = "XADON_AI";
const BASE_DIR = "/home/container";

// Store token in memory - resets on bot restart
let GITHUB_TOKEN_RUNTIME = null;

function readFileSafe(file) {
 try {
 return fs.readFileSync(file, "utf8");
 } catch {
 return null;
 }
}

function encodeContent(content) {
 return Buffer.from(content).toString("base64");
}

async function getFileSha(octokit, filePath) {
 try {
 const { data } = await octokit.repos.getContent({
 owner: OWNER,
 repo: REPO,
 path: filePath,
 });
 return data.sha;
 } catch {
 return null;
 }
}

// 🔁 Recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
 const files = fs.readdirSync(dirPath);

 files.forEach(file => {
 const fullPath = path.join(dirPath, file);
 if (fs.statSync(fullPath).isDirectory()) {
 arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
 } else {
 arrayOfFiles.push(fullPath);
 }
 });

 return arrayOfFiles;
}

module.exports = {
 name: 'gitmgr',
 alias: ['git', 'repo', 'xrepo'],
 description: 'Pro GitHub repo controller for XADON-AI',
 category: 'owner',
 owner: true,
 usage: '.gitmgr <subcommand>',

 execute: async (sock, m, { args, reply }) => {
 const sub = args[0]?.toLowerCase();

 // 🔑 SET TOKEN COMMAND - RUN THIS FIRST
 if (sub === "auth" || sub === "token") {
 const token = args[1];
 if (!token ||!token.startsWith("ghp_")) {
 return reply(`❌ Invalid token format

Usage:.gitmgr auth ghp_your_token_here

⚠️ Get token: GitHub → Settings → Developer settings → Personal access tokens
✅ Scope needed: repo

> ֎`);
 }
 GITHUB_TOKEN_RUNTIME = token;
 await sock.sendMessage(m.chat, { react: { text: '🔒', key: m.key } });
 return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 *֎ • GIT AUTH SUCCESS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

🔑 Token stored in memory
⚠️ Resets when bot restarts
✅ Ready to use.gitmgr commands

> ֎`);
 }

 // Check if token is set
 if (!GITHUB_TOKEN_RUNTIME) {
 return reply(`❌ GitHub token not set

Run first:.gitmgr auth ghp_your_token_here

⚠️ Revoke the old token you leaked and make a new one

> ֎`);
 }

 const octokit = new Octokit({ auth: GITHUB_TOKEN_RUNTIME });
 const input = args.slice(1).join(" ");

 await sock.sendMessage(m.chat, { react: { text: '⚡', key: m.key } });

 if (!sub || sub === "help") {
 return reply(`֎ ✪ *XADON AI • GIT MANAGER* ✪ ֎

🔧 Commands for ${OWNER}/${REPO}:

🔑 auth <token> - Set GitHub token
📂 ls <path> - List repo files
📖 cat <path> - Read file from repo
⬆️ upload <local> | <repo_path> - Push single file to repo
📦 transfer <local_dir> | <repo_dir> - Transfer entire folder recursively
🔁 move <local> | <repo_path> - Move panel file to repo
⬇️ download <repo_path> <local> - Pull repo file to panel
🗑️ rm <repo_path> - Delete file from repo
📁 mkdir <repo_path> - Create folder in repo
✍️ write <repo_path> <text> - Create/write file directly
🔍 scan <path> - Scan repo directory

Examples:
-.gitmgr auth ghp_xxx
-.gitmgr ls plugins
-.gitmgr transfer plugins | git plugins
-.gitmgr transfer commands | git src/commands
-.gitmgr move plugins/antilink.js | git plugins/

⚠️ Base panel: ${BASE_DIR}
⚠️ Transfer handles subfolders automatically

> ֎`);
 }

 try {
 // 📦 TRANSFER ENTIRE DIRECTORY RECURSIVELY
 if (sub === "transfer") {
 const [localPart, repoPart] = input.split("|").map(s => s.trim());
 if (!localPart ||!repoPart) {
 return reply("❌ Usage:.gitmgr transfer <local_dir> | git <repo_dir>\nExample:.gitmgr transfer plugins | git plugins\n> ֎");
 }

 const localDir = path.join(BASE_DIR, localPart);
 let repoDir = repoPart.replace(/^git\s*/, "").replace(/\/$/, "");

 if (!fs.existsSync(localDir)) {
 await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
 return reply(`❌ Local directory not found: ${localPart}\n\n> ֎`);
 }

 if (!fs.statSync(localDir).isDirectory()) {
 return reply(`❌ ${localPart} is not a directory. Use 'upload' for single files\n> ֎`);
 }

 await reply(`📦 Scanning ${localPart}... please wait\n> ֎`);

 const allFiles = getAllFiles(localDir);
 if (allFiles.length === 0) {
 return reply(`❌ No files found in ${localPart}\n\n> ֎`);
 }

 let success = 0;
 let failed = 0;
 let failedList = [];

 for (const filePath of allFiles) {
 try {
 const relativePath = path.relative(localDir, filePath);
 const repoPath = path.join(repoDir, relativePath).replace(/\\/g, "/");
 const content = fs.readFileSync(filePath);
 const sha = await getFileSha(octokit, repoPath);

 await octokit.repos.createOrUpdateFileContents({
 owner: OWNER,
 repo: REPO,
 path: repoPath,
 message: `XADON AI: Transfer ${relativePath}`,
 content: content.toString("base64"),
 sha: sha || undefined,
 });

 success++;
 await new Promise(r => setTimeout(r, 500)); // avoid rate limit
 } catch (err) {
 failed++;
 failedList.push(path.basename(filePath));
 console.log(`[TRANSFER FAIL] ${filePath}:`, err.message);
 }
 }

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 *֎ • DIRECTORY TRANSFER COMPLETE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

📂 Local: ${localPart}
📁 Repo: ${repoDir}
✅ Uploaded: ${success} files
${failed > 0? `❌ Failed: ${failed} files\n` : ''}
${failedList.length > 0? `Failed: ${failedList.slice(0, 5).join(", ")}${failedList.length > 5? '...' : ''}\n` : ''}
> ֎`);
 }

 // 📂 LIST REPO DIRECTORY
 if (sub === "ls") {
 const repoPath = input || "";
 const { data } = await octokit.repos.getContent({
 owner: OWNER,
 repo: REPO,
 path: repoPath,
 });

 let out = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 *֎ • REPO: ${REPO}/${repoPath}*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n`;

 data.forEach(f => {
 out += (f.type === "dir"? "📁 " : "📄 ") + f.name + "\n";
 });

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(out + "\n> ֎");
 }

 // 📖 READ FILE FROM REPO
 if (sub === "cat") {
 if (!input) return reply("❌ Usage:.gitmgr cat <repo_path>\n\n> ֎");

 const { data } = await octokit.repos.getContent({
 owner: OWNER,
 repo: REPO,
 path: input,
 });

 const content = Buffer.from(data.content, "base64").toString("utf8");
 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`📖 FILE: ${input}\n\n${content.slice(0, 4000)}${content.length > 4000? '\n\n...truncated' : ''}\n\n> ֎`);
 }

 // ⬆️ UPLOAD/MOVE PANEL FILE TO REPO
 if (sub === "upload" || sub === "move") {
 const [localPart, repoPart] = input.split("|").map(s => s.trim());
 if (!localPart ||!repoPart) {
 return reply("❌ Usage:.gitmgr move <local_path> | git <repo_path>\nExample:.gitmgr move plugins/antilink.js | git plugins/\n\n> ֎");
 }

 const localPath = path.join(BASE_DIR, localPart);
 let repoPath = repoPart.replace(/^git\s*/, "");

 if (repoPath.endsWith("/")) {
 repoPath += path.basename(localPath);
 }

 if (!fs.existsSync(localPath)) {
 await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
 return reply(`❌ Local file not found: ${localPart}\n\n> ֎`);
 }

 const content = readFileSafe(localPath);
 const sha = await getFileSha(octokit, repoPath);

 await octokit.repos.createOrUpdateFileContents({
 owner: OWNER,
 repo: REPO,
 path: repoPath,
 message: `XADON AI: ${sub} ${localPart} -> ${repoPath}`,
 content: encodeContent(content),
 sha: sha || undefined,
 });

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 *֎ • GIT PUSH SUCCESS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

⬆️ Local: ${localPart}
📁 Repo: ${repoPath}
✅ Committed to ${REPO}

> ֎`);
 }

 // ⬇️ DOWNLOAD REPO FILE TO PANEL
 if (sub === "download") {
 const [repoPath, localPath] = args.slice(1);
 if (!repoPath ||!localPath) {
 return reply("❌ Usage:.gitmgr download <repo_path> <local_path>\n\n> ֎");
 }

 const { data } = await octokit.repos.getContent({
 owner: OWNER,
 repo: REPO,
 path: repoPath,
 });

 const content = Buffer.from(data.content, "base64").toString("utf8");
 const fullLocalPath = path.join(BASE_DIR, localPath);

 fs.mkdirSync(path.dirname(fullLocalPath), { recursive: true });
 fs.writeFileSync(fullLocalPath, content);

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`✅ Downloaded ${repoPath} -> ${localPath}\n\n> ֎`);
 }

 // 🗑️ DELETE FILE FROM REPO
 if (sub === "rm" || sub === "delete") {
 if (!input) return reply("❌ Usage:.gitmgr rm <repo_path>\n\n> ֎");

 const sha = await getFileSha(octokit, input);
 if (!sha) {
 await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
 return reply("❌ File not found in repo\n> ֎");
 }

 await octokit.repos.deleteFile({
 owner: OWNER,
 repo: REPO,
 path: input,
 message: `XADON AI: Delete ${input}`,
 sha: sha,
 });

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`🗑️ Deleted ${input} from repo\n\n> ֎`);
 }

 // 📁 CREATE FOLDER IN REPO
 if (sub === "mkdir") {
 if (!input) return reply("❌ Usage:.gitmgr mkdir <repo_path>\n\n> ֎");

 const gitkeepPath = path.join(input, ".gitkeep").replace(/\\/g, "/");

 await octokit.repos.createOrUpdateFileContents({
 owner: OWNER,
 repo: REPO,
 path: gitkeepPath,
 message: `XADON AI: Create folder ${input}`,
 content: encodeContent("# Folder created by XADON AI"),
 });

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`📁 Folder created: ${input}\n\n> ֎`);
 }

 // ✍️ WRITE FILE DIRECTLY TO REPO
 if (sub === "write") {
 const [repoPath,...textArr] = args.slice(1);
 const text = textArr.join(" ");
 if (!repoPath ||!text) {
 return reply("❌ Usage:.gitmgr write <repo_path> <text>\n\n> ֎");
 }

 const sha = await getFileSha(octokit, repoPath);

 await octokit.repos.createOrUpdateFileContents({
 owner: OWNER,
 repo: REPO,
 path: repoPath,
 message: `XADON AI: Write ${repoPath}`,
 content: encodeContent(text),
 sha: sha || undefined,
 });

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`✅ File written to repo: ${repoPath}\n\n> ֎`);
 }

 // 🔍 SCAN REPO DIR
 if (sub === "scan") {
 const repoPath = input || "";
 const { data } = await octokit.repos.getContent({
 owner: OWNER,
 repo: REPO,
 path: repoPath,
 });

 let files = 0, dirs = 0;
 data.forEach(f => f.type === "dir"? dirs++ : files++);

 await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
 return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 *֎ • REPO SCAN*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦

📂 Path: ${repoPath || '/'}
📄 Files: ${files}
📁 Folders: ${dirs}
📊 Total: ${data.length}

> ֎`);
 }

 await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
 return reply("❌ Unknown subcommand. Use.gitmgr for help\n> ֎");

 } catch (err) {
 console.error('[GITMGR ERROR]', err?.message || err);
 await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

 let msg = "❌ GitHub operation failed\n";
 if (err.status === 404) msg += "• File/folder not found in repo";
 else if (err.status === 401) msg += "• Invalid GitHub token - run.gitmgr auth again";
 else if (err.status === 403) msg += "• Token missing 'repo' permission";
 else if (err.status === 422) msg += "• File too large or invalid path";
 else msg += `• ${err.message}`;

 return reply(msg + "\n\n> ֎");
 }
 }
};