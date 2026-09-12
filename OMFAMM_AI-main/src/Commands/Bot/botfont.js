/**
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * XADON AI • BOT FONT
 * ✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 * Set global or per-group text font styles
 */

const fs = require("fs");
const path = require("path");
const styles = require("../Core/'.js"); // fixed path

const DB_PATH = path.join(__dirname, "../../../database/botfont.json");

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    }
  } catch {}
  return { global: null, groups: {} };
}

function saveDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getFont(jid) {
  const db = loadDB();
  if (jid?.endsWith("@g.us") && db.groups[jid]) {
    return db.groups[jid]; // Group font first
  }
  return db.global; // Fallback to global
}

// ── COMMAND MODULE ──────────────────────────────────────────────
module.exports = {
  name: "botfont",
  alias: ["setfont"],
  category: "Tools",
  desc: "Set bot font style globally or per group",
  reactions: { start: '✎', success: '֎' },

  execute: async (sock, m, { args, reply }) => {
    const jid = m.key.remoteJid;
    const styleList = Object.keys(styles).filter(key => typeof styles[key] === "function");

    /* ---------- LIST FONTS ---------- */
    if (!args[0] || args[0].toLowerCase() === "list") {
      let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n - FONT LIST •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *AVAILABLE FONTS*\n`;
      styleList.forEach((s, i) => {
        const preview = styles[s]("XADON AI");
        text += `│ ${i + 1}. ${s}\n│ ❏ ➜ ${preview}\n`;
      });
      text += `╰─────────────────────────╯\n\n_*✐ Usage*_ : ֎botfont <number> | ֎botfont group <number>`;
      return reply(text);
    }

    const index = parseInt(args[0]);
    if (isNaN(index)) {
      return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.botfont list → Show all fonts
│ ❏.botfont <number> → Set global
│ ❏.botfont group <number> → Set group
╰─────────────────────────╯`
      );
    }

    const fontName = styleList[index - 1];
    if (!fontName) return reply("_*❏ Invalid font number*_");

    const db = loadDB();

    /* ---------- GROUP FONT ---------- */
    if (args[0].toLowerCase() === "group") {
      const groupIndex = parseInt(args[1]);
      const groupFont = styleList[groupIndex - 1];
      if (!groupFont) return reply("_*❏ Invalid group font number*_");

      db.groups[jid] = groupFont;
      saveDB(db);
      return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GROUP FONT SET*
│ ❏ Font : ${groupFont}
│ ❏ Scope : This Group
╰─────────────────────────╯`
      );
    }

    /* ---------- GLOBAL FONT ---------- */
    db.global = fontName;
    saveDB(db);
    return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GLOBAL FONT SET*
│ ❏ Font : ${fontName}
│ ❏ Scope : All Chats
╰─────────────────────────╯`
      );
  },

  getFont
};