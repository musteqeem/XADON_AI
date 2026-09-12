#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${XADON_BRANCH:-main}"

log()  { printf '\n\033[1;36m[XADON UPDATE]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[OK]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[WARN]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

trap 'die "Update failed at line $LINENO. Existing session/database were not intentionally deleted."' ERR

cd "$APP_DIR"

[ -d ".git" ] || die "This directory is not an XADON AI Git repository."

# --------------------------------------------------
# Prevent concurrent updates
# --------------------------------------------------

LOCK_FILE=".xadon-update.lock"

if command -v flock >/dev/null 2>&1; then
    exec 9>"$LOCK_FILE"

    if ! flock -n 9; then
        die "Another XADON update is already running."
    fi
fi

# --------------------------------------------------
# Verify Node
# --------------------------------------------------

command -v node >/dev/null 2>&1 || die "Node.js is not installed."
command -v npm >/dev/null 2>&1 || die "npm is not installed."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"

if [ "$NODE_MAJOR" -lt 20 ]; then
    die "XADON AI requires Node.js 20+."
fi

# --------------------------------------------------
# Backup persistent state
# --------------------------------------------------

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
BACKUP_DIR="$APP_DIR/backups/$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

log "Backing up persistent state..."

if [ -d sessions ]; then
    cp -a sessions "$BACKUP_DIR/"
fi

if [ -d database ]; then
    cp -a database "$BACKUP_DIR/"
fi

if [ -f .env ]; then
    cp -a .env "$BACKUP_DIR/"
fi

ok "Backup created: $BACKUP_DIR"

# --------------------------------------------------
# Update source
# --------------------------------------------------

log "Fetching latest XADON AI..."

git fetch origin "$BRANCH"

CURRENT_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "origin/$BRANCH")"

if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
    ok "Already up to date."
else
    log "Updating source..."

    git reset --hard "origin/$BRANCH"

    ok "Source updated."
fi

# --------------------------------------------------
# Restore persistent state
# --------------------------------------------------

log "Restoring persistent data..."

mkdir -p sessions database

# Restore only if Git update replaced them.
if [ -d "$BACKUP_DIR/sessions" ]; then
    rm -rf sessions
    cp -a "$BACKUP_DIR/sessions" sessions
fi

if [ -d "$BACKUP_DIR/database" ]; then
    rm -rf database
    cp -a "$BACKUP_DIR/database" database
fi

if [ -f "$BACKUP_DIR/.env" ]; then
    cp -a "$BACKUP_DIR/.env" .env
fi

ok "Persistent data restored."

# --------------------------------------------------
# Dependencies
# --------------------------------------------------

log "Updating dependencies..."

if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi

# --------------------------------------------------
# Validate
# --------------------------------------------------

log "Validating XADON AI..."

node --check index.js

# --------------------------------------------------
# Restart when appropriate
# --------------------------------------------------

if command -v pm2 >/dev/null 2>&1; then

    if pm2 describe XADON_AI >/dev/null 2>&1; then
        log "Restarting PM2 process..."
        pm2 restart XADON_AI --update-env
        pm2 save
        ok "PM2 restarted."
    fi

fi

# --------------------------------------------------
# Cleanup old backups
# --------------------------------------------------

log "Cleaning old backups..."

find "$APP_DIR/backups" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    -mtime +14 \
    -exec rm -rf {} +

# --------------------------------------------------
# Done
# --------------------------------------------------

echo
ok "XADON AI update completed."
echo "Commit: $(git rev-parse --short HEAD)"
echo "Session preserved."
echo "Database preserved."
echo "Environment preserved."