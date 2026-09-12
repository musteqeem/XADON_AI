#!/usr/bin/env bash
set -Eeuo pipefail

ARCHIVE="${1:-}"
APP_DIR="${XADON_DIR:-$PWD}"
SESSION_DIR="$APP_DIR/sessions"

[ -n "$ARCHIVE" ] || { echo "Usage: ./session-import.sh /path/to/session.zip"; exit 1; }
[ -f "$ARCHIVE" ] || { echo "Archive not found: $ARCHIVE"; exit 1; }

mkdir -p "$APP_DIR/backups"
TS="$(date +%Y%m%d-%H%M%S)"
[ -d "$SESSION_DIR" ] && cp -a "$SESSION_DIR" "$APP_DIR/backups/session-before-import-$TS"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

case "$ARCHIVE" in
  *.zip) command -v unzip >/dev/null || { echo "unzip is required"; exit 1; }; unzip -q "$ARCHIVE" -d "$TMP" ;;
  *.tar.gz|*.tgz) tar -xzf "$ARCHIVE" -C "$TMP" ;;
  *) echo "Supported formats: .zip, .tar.gz, .tgz"; exit 1 ;;
esac

SOURCE="$TMP"
if [ -d "$TMP/sessions" ]; then SOURCE="$TMP/sessions"; fi

rm -rf "$SESSION_DIR"
mkdir -p "$SESSION_DIR"
cp -a "$SOURCE"/. "$SESSION_DIR"/

echo "Session archive imported."
echo "Start XADON AI and verify the connection."
