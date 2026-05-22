const fs = require("fs");
const path = require("path");
const styles = require("../Core/styles.js"); // fix this path to your actual file

const FILE = path.join(__dirname, "../database/botfont.json");

function loadDB() {
  try {
    if (fs.existsSync(FILE)) {
      return JSON.parse(fs.readFileSync(FILE, "utf8"));
    }
  } catch (e) {
    console.error("[XDN BotFont] Load error:", e.message);
  }
  return { global: null, groups: {} };
}

function saveDB(data) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("[XDN BotFont] Save error:", e.message);
  }
}

function getFont(jid) {
  const db = loadDB();

  // Group font first
  if (jid?.endsWith("@g.us") && db.groups[jid]) {
    return db.groups[jid];
  }

  // Global font
  return db.global;
}

module.exports = {
  name: "botfont",
  alias: ["setfont", "font"],
  category: "tools",
  desc: "Set global or group font style",

  execute: async (sock, m, { args, reply }) => {
    const jid = m.key.remoteJid;
    const styleList = Object.keys(styles).filter(
      key => typeof styles[key] === "function"
    );

    /* ---------- LIST FONTS ---------- */
    if (!args[0] || args[0].toLowerCase() === "list") {
      let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FONT ARCHIVE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *Available Fonts: ${styleList.length}*
╰─────────────────────╯

`;

      styleList.forEach((s, i) => {
        try {
          const preview = styles[s]("XDN AI");
          text += `֎ ${i + 1}. *${s}*\n ❏ ${preview}\n\n`;
        } catch {
          text += `֎ ${i + 1}. *${s}*\n ❏ Preview failed\n`;
        }
      });

      text += `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Usage:
֎.botfont <number> → Set global font
֎.botfont group <number> → Set group font
֎.botfont list → Show this menu`;
      return reply(text);
    }

    /* ---------- GROUP FONT ---------- */
    if (args[0].toLowerCase() === "group") {
      if (!jid.endsWith("@g.us")) {
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FONT ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Group font can only be set in a group chat.`
        );
      }

      const groupIndex = parseInt(args[1]);
      if (isNaN(groupIndex)) {
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FONT ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Usage:.botfont group <number>

Example:.botfont group 3`
        );
      }

      const groupFont = styleList[groupIndex - 1];
      if (!groupFont) return reply("֎ Invalid font number.");

      const db = loadDB();
      db.groups[jid] = groupFont;
      saveDB(db);

      return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GROUP FONT UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Target : Group
│ ❏ Font : ${groupFont}
│ ❏ Status : ACTIVE
╰─────────────────────╯`
      );
    }

    /* ---------- GLOBAL FONT ---------- */
    const index = parseInt(args[0]);
    if (isNaN(index)) {
      return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • FONT ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Invalid input.

Usage:
֎.botfont list
֎.botfont <number>
֎.botfont group <number>`
      );
    }

    const fontName = styleList[index - 1];
    if (!fontName) return reply("֎ Invalid font number.");

    const db = loadDB();
    db.global = fontName;
    saveDB(db);

    return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GLOBAL FONT UPDATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Target : Global
│ ❏ Font : ${fontName}
│ ❏ Status : ACTIVE
╰─────────────────────╯
Preview: ${styles[fontName]("XDN AI")}`
    );
  },

  getFont
};