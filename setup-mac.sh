#!/bin/bash
# Sets up and installs Personal Study on a Mac.
#
# What it does, in order (anything already installed is skipped):
#   1. Apple's developer tools (a window pops up; click Install)
#   2. Rust, which compiles the Mac side of the app
#   3. Node.js (through nvm), which builds the interface
#   4. Downloads the app's code to ~/Personal-study-app
#   5. Builds the app and copies it to your Applications folder
#
# Run it again any time to update to the latest version.

set -euo pipefail

REPO="https://github.com/9wx9st9vhm-tech/Personal-study-app.git"
BRANCH="claude/serene-knuth-6ljbl9"
DIR="$HOME/Personal-study-app"
APP_NAME="Personal Study.app"

say() { printf '\n\033[1;33m▸ %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$1"; exit 1; }

[[ "$(uname)" == "Darwin" ]] || fail "This script is for macOS."

# 1. Apple's developer tools ------------------------------------------------
if ! xcode-select -p >/dev/null 2>&1; then
  say "Installing Apple's developer tools. A window will appear: click Install and wait for it to finish."
  xcode-select --install >/dev/null 2>&1 || true
  until xcode-select -p >/dev/null 2>&1; do sleep 10; done
fi
say "Apple's developer tools: ready"

# 2. Rust ------------------------------------------------------------------
# shellcheck disable=SC1091
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"
if ! command -v cargo >/dev/null 2>&1; then
  say "Installing Rust…"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
  # Make Rust available in future Terminal windows too.
  grep -qs 'cargo/env' "$HOME/.zshrc" || echo '. "$HOME/.cargo/env"' >> "$HOME/.zshrc"
fi
say "Rust: $(cargo --version)"

# 3. Node.js -----------------------------------------------------------------
export NVM_DIR="$HOME/.nvm"
if ! command -v npm >/dev/null 2>&1; then
  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    say "Installing Node.js…"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | PROFILE="$HOME/.zshrc" bash
  fi
  # nvm doesn't work with this script's strict mode, so relax it briefly.
  set +eu
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm install --lts
  set -eu
fi
say "Node.js: $(node --version)"

# 4. The app's code ------------------------------------------------------------
if [[ -d "$DIR/.git" ]]; then
  say "Updating the code in $DIR…"
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" checkout -q "$BRANCH"
  git -C "$DIR" pull --ff-only origin "$BRANCH"
else
  say "Downloading the code to $DIR…"
  git clone --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR"

# 5. Build and install ---------------------------------------------------------
say "Installing packages…"
npm ci

say "Building the app. The first time takes 5–10 minutes while Rust compiles…"
npm run app:build -- --bundles app

BUILT="$DIR/src-tauri/target/release/bundle/macos/$APP_NAME"
[[ -d "$BUILT" ]] || fail "The build finished but the app wasn't found at $BUILT"

say "Copying to Applications…"
rm -rf "/Applications/$APP_NAME"
cp -R "$BUILT" "/Applications/"
# You built it yourself, so tell macOS not to treat it as an unknown download.
xattr -dr com.apple.quarantine "/Applications/$APP_NAME" 2>/dev/null || true

say "Done! Opening Personal Study…"
open "/Applications/$APP_NAME"
printf '\nFind it any time in Applications or with Spotlight (⌘ Space, type "Personal Study").\n'
printf 'To update later, run this script again.\n\n'
