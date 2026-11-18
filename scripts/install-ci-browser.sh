#!/usr/bin/env bash
set -euo pipefail

[[ $# == 1 && -x $1 ]] || { echo 'Pass the installed Playwright executable' >&2; exit 1; }
# Some hosted AWS runners select a very slow regional EC2 apt mirror. Change
# only the ephemeral runner mirror list; production servers never run this.
if [[ -f /etc/apt/apt-mirrors.txt ]]; then
  printf '%s\n' 'https://archive.ubuntu.com/ubuntu' | sudo tee /etc/apt/apt-mirrors.txt >/dev/null
fi
printf '%s\n' 'Acquire::Retries "3";' 'Acquire::http::Timeout "30";' 'Acquire::https::Timeout "30";' \
  | sudo tee /etc/apt/apt.conf.d/80-kidbridge-network >/dev/null
# The tests use Chromium headless, so avoid downloading the full GUI browser.
timeout --signal=TERM --kill-after=15s 480s "$1" install --with-deps --only-shell chromium
