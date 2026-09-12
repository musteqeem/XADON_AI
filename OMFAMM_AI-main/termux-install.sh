#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

REPO="https://github.com/musteqeem/XADON_AI.git"
DIR="${HOME}/XADON_AI"

pkg update -y
pkg install -y git nodejs-lts python make clang pkg-config

if [ -d "$DIR/.git" ]; then
  cd "$DIR"
  git fetch --prune origin main
  git reset --hard origin/main
else
  rm -rf "$DIR" 2>/dev/null || true
  git clone --branch main --single-branch "$REPO" "$DIR"
  cd "$DIR"
fi

mkdir -p sessions database logs backups
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
node --check index.js

echo "XADON AI installed."
echo "Start with: cd ~/XADON_AI && node index.js"
exec node index.js
