#!/usr/bin/env bash
set -Eeuo pipefail

REPO="${XADON_REPO:-https://github.com/musteqeem/XADON_AI.git}"
BRANCH="${XADON_BRANCH:-main}"
APP_DIR="${XADON_DIR:-$HOME/XADON_AI}"

log(){ printf "\n\033[1;36m[XADON]\033[0m %s\n" "$*"; }
ok(){ printf "\033[1;32m✔\033[0m %s\n" "$*"; }
warn(){ printf "\033[1;33m⚠\033[0m %s\n" "$*"; }
die(){ printf "\033[1;31m✖ %s\033[0m\n" "$*" >&2; exit 1; }

trap 'die "Deployment stopped at line $LINENO. Persistent data was not intentionally removed."' ERR

log "XADON AI PRODUCTION AUTO DEPLOYER"
printf "Repository: %s\nBranch:     %s\nDirectory:  %s\n" "$REPO" "$BRANCH" "$APP_DIR"

command -v git >/dev/null 2>&1 || die "Git is required."
command -v node >/dev/null 2>&1 || die "Node.js is required."
command -v npm >/dev/null 2>&1 || die "npm is required."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js 20+ required. Found $(node -v)."

if [ -d "$APP_DIR/.git" ]; then
    log "Existing XADON installation found. Updating without deleting persistent data."
    cd "$APP_DIR"
    mkdir -p sessions database logs backups

    # Snapshot persistent data before source refresh.
    TS="$(date +%Y%m%d-%H%M%S)"
    BK="$APP_DIR/backups/autodeploy-$TS"
    mkdir -p "$BK"
    [ -d sessions ] && cp -a sessions "$BK/sessions"
    [ -d database ] && cp -a database "$BK/database"
    [ -f .env ] && cp -a .env "$BK/.env"

    git fetch --prune origin "$BRANCH"
    git reset --hard "origin/$BRANCH"

    # Restore persistent data in case a tracked deployment accidentally contained
    # placeholders with the same names.
    [ -d "$BK/sessions" ] && { rm -rf sessions; cp -a "$BK/sessions" sessions; }
    [ -d "$BK/database" ] && { rm -rf database; cp -a "$BK/database" database; }
    [ -f "$BK/.env" ] && cp -a "$BK/.env" .env
else
    [ -e "$APP_DIR" ] && die "$APP_DIR exists but is not a Git repository."
    log "Cloning XADON AI..."
    git clone --branch "$BRANCH" --single-branch "$REPO" "$APP_DIR"
    cd "$APP_DIR"
fi

mkdir -p sessions database logs backups
chmod 700 sessions 2>/dev/null || true

# Never commit local authentication/configuration.
touch .gitignore
for item in sessions/ database/ logs/ backups/ .env .xadon-session.lock; do
    grep -qxF "$item" .gitignore 2>/dev/null || printf '%s\n' "$item" >> .gitignore
done

if [ ! -f .env ]; then
    cat > .env <<'EOF'
NODE_ENV=production
BOT_NAME=XADON AI
PREFIX=.
SESSION_NAME=sessions
PORT=3000
EOF
    chmod 600 .env
    ok "Created .env with safe defaults."
else
    ok "Existing .env preserved."
fi

log "Installing dependencies..."
if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi

log "Running syntax and project doctor..."
node --check index.js
npm run doctor --if-present

cat > start.sh <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
mkdir -p sessions database logs
exec node index.js
EOF
chmod +x start.sh

cat > update.sh <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
exec bash autodeploy.sh
EOF
chmod +x update.sh

ok "XADON AI is ready."
echo
echo "Start:  cd \"$APP_DIR\" && ./start.sh"
echo "Update: cd \"$APP_DIR\" && ./update.sh"
echo "Session directory: $APP_DIR/sessions"
echo
echo "For Pterodactyl, use: node index.js"
echo "For PM2, use: pm2 start ecosystem.config.cjs"
