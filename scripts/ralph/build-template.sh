#!/usr/bin/env bash
# One-off, per machine: snapshot a sandbox holding what every ralph ticket sandbox needs, so a
# ticket run does not download it first:
#   - PHP 8.4 or later with the extensions CI uses (pdo_mysql, redis) and Laravel's usual ones,
#     plus Composer
#   - Node 24, as CI uses, with pnpm through corepack
#   - agent-browser and a Chromium it can drive, for the browser check. Chrome for Testing has
#     no Linux ARM64 build and Playwright does not list Ubuntu 26.04, so Playwright's Chromium
#     is installed as if for 24.04
# The MariaDB image is not baked in: the sandbox's own Docker images are not part of a saved
# template, so each ticket's setup pulls it.
# Re-run to refresh, bumping RALPH_TEMPLATE's tag when you do.
set -euo pipefail

TEMPLATE="${RALPH_TEMPLATE:-gtrack-ralph:1}"
BUILDER=ralph-template-builder
AGENT_BROWSER_VERSION=0.39.1
PLAYWRIGHT_VERSION=1.56.1
WORKSPACE="$(mktemp -d)"

sbx create --name "$BUILDER" --no-progress claude "$WORKSPACE" </dev/null
sbx exec -w "$WORKSPACE" "$BUILDER" bash -c "
  set -euo pipefail
  sudo apt-get update -qq
  sudo apt-get install -y -qq php-cli php-mysql php-redis php-mbstring php-xml php-curl php-zip php-intl php-bcmath unzip
  php -r 'exit(PHP_VERSION_ID >= 80400 ? 0 : 1);' || { echo 'PHP 8.4 or later is needed; this image has '\$(php -r 'echo PHP_VERSION;'); exit 1; }
  curl -fsSL https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
  composer --version
  v=\$(curl -fsSL https://nodejs.org/dist/index.json | jq -r '[.[] | select(.version | startswith(\"v24.\"))][0].version')
  curl -fsSL https://nodejs.org/dist/\$v/node-\$v-linux-\$(uname -m | sed 's/aarch64/arm64/; s/x86_64/x64/').tar.xz |
    sudo tar -xJ -C /usr/local --strip-components=1
  hash -r
  node --version
  sudo corepack enable pnpm
  npm i -g --no-audit --no-fund agent-browser@$AGENT_BROWSER_VERSION
  export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-\$(uname -m | sed 's/aarch64/arm64/; s/x86_64/x64/')
  npx -y playwright@$PLAYWRIGHT_VERSION install chromium
  sudo -E env PATH=\"\$PATH\" npx -y playwright@$PLAYWRIGHT_VERSION install-deps chromium
  agent-browser doctor
" </dev/null
# Saving a running sandbox asks for a confirmation that cannot be given without a terminal.
sbx stop "$BUILDER" </dev/null
sbx template save "$BUILDER" "$TEMPLATE" </dev/null
sbx rm -f "$BUILDER" </dev/null
rm -rf "$WORKSPACE"
echo "saved $TEMPLATE"
