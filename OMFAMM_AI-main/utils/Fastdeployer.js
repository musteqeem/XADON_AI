#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

const REPO = "https://github.com/musteqeem/XADON_AI.git";
const BRANCH = "main";
const APP_DIR = path.join(process.cwd(), "XADON_AI");

const log = (msg) => console.log(`\n\x1b[36m[XADON DEPLOYER]\x1b[0m ${msg}`);
const ok = (msg) => console.log(`\x1b[32m✔\x1b[0m ${msg}`);
const fail = (msg) => {
    console.error(`\x1b[31m✖ ${msg}\x1b[0m`);
    process.exit(1);
};

function commandExists(command) {
    try {
        execSync(
            process.platform === "win32"
                ? `where ${command}`
                : `command -v ${command}`,
            { stdio: "ignore" }
        );
        return true;
    } catch {
        return false;
    }
}

function run(command, options = {}) {
    log(command);

    try {
        execSync(command, {
            stdio: "inherit",
            shell: true,
            ...options
        });
    } catch {
        fail(`Command failed: ${command}`);
    }
}

async function main() {
    console.log(`
╔══════════════════════════════════════════╗
║        XADON AI AUTO DEPLOYER            ║
║        MUSTEQEEM/XADON_AI                ║
╚══════════════════════════════════════════╝
`);

    // ------------------------------------------------
    // Check Git
    // ------------------------------------------------

    if (!commandExists("git")) {
        fail(
            "Git is not installed.\n" +
            "Install Git first, then run the deployer again."
        );
    }

    ok("Git detected.");

    // ------------------------------------------------
    // Check Node
    // ------------------------------------------------

    const nodeMajor = Number(process.versions.node.split(".")[0]);

    if (nodeMajor < 20) {
        fail(
            `Node.js 20+ is required.\n` +
            `Current version: ${process.version}`
        );
    }

    ok(`Node.js ${process.version} detected.`);

    // ------------------------------------------------
    // Check npm
    // ------------------------------------------------

    if (!commandExists("npm")) {
        fail("npm was not found.");
    }

    ok("npm detected.");

    // ------------------------------------------------
    // Clone repository
    // ------------------------------------------------

    if (fs.existsSync(APP_DIR)) {
        if (fs.existsSync(path.join(APP_DIR, ".git"))) {
            log("XADON AI installation already exists.");

            run("git fetch origin", {
                cwd: APP_DIR
            });

            run(`git reset --hard origin/${BRANCH}`, {
                cwd: APP_DIR
            });

            ok("Repository updated.");
        } else {
            fail(
                `${APP_DIR} already exists but is not an XADON AI Git repository.`
            );
        }
    } else {
        log("Cloning XADON AI...");

        run(
            `git clone --branch ${BRANCH} --single-branch ${REPO} "${APP_DIR}"`
        );

        ok("Repository cloned.");
    }

    // ------------------------------------------------
    // Enter application
    // ------------------------------------------------

    process.chdir(APP_DIR);

    // ------------------------------------------------
    // Create required folders
    // ------------------------------------------------

    log("Creating required directories...");

    [
        "sessions",
        "database",
        "logs",
        "backups"
    ].forEach(dir => {
        fs.mkdirSync(dir, { recursive: true });
    });

    ok("Required directories created.");

    // ------------------------------------------------
    // Install dependencies
    // ------------------------------------------------

    if (fs.existsSync("package-lock.json")) {
        run("npm ci --omit=dev");
    } else {
        run("npm install --omit=dev");
    }

    ok("Dependencies installed.");

    // ------------------------------------------------
    // Validate index.js
    // ------------------------------------------------

    log("Checking application syntax...");

    run("node --check index.js");

    ok("Application syntax is valid.");

    // ------------------------------------------------
    // Create startup script
    // ------------------------------------------------

    const startup = `#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")"

mkdir -p sessions database logs

exec node index.js
`;

    fs.writeFileSync("start.sh", startup, {
        mode: 0o755
    });

    ok("Startup script created.");

    // ------------------------------------------------
    // Create update script
    // ------------------------------------------------

    const update = `#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "$0")"

echo "[XADON] Updating..."

git fetch origin main

git reset --hard origin/main

mkdir -p sessions database logs backups

if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi

node --check index.js

echo "[XADON] Update completed."
`;

    fs.writeFileSync("update.sh", update, {
        mode: 0o755
    });

    ok("Update script created.");

    // ------------------------------------------------
    // Start bot
    // ------------------------------------------------

    console.log(`
\x1b[32m╔══════════════════════════════════════════╗
║       XADON AI DEPLOYMENT COMPLETE       ║
╚══════════════════════════════════════════╝\x1b[0m

Repository:
  ${REPO}

Directory:
  ${APP_DIR}

Session:
  ${path.join(APP_DIR, "sessions")}

Database:
  ${path.join(APP_DIR, "database")}

Starting XADON AI...
`);

    // IMPORTANT:
    // Do NOT use PM2 here.
    // Pterodactyl should manage the Node process itself.

    const child = spawnSync(
        process.execPath,
        ["index.js"],
        {
            stdio: "inherit",
            cwd: APP_DIR
        }
    );

    process.exit(
        typeof child.status === "number"
            ? child.status
            : 0
    );
}

main().catch(error => {
    console.error("\n\x1b[31mDeployment failed:\x1b[0m");
    console.error(error);
    process.exit(1);
});