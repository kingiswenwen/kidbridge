#!/usr/bin/env bash
set -euo pipefail

for name in DEPLOY_HOST DEPLOY_PORT DEPLOY_USER DEPLOY_PATH DEPLOY_URL GITHUB_SHA; do
  [[ -n ${!name:-} ]] || { echo "Missing $name" >&2; exit 1; }
done
[[ $DEPLOY_HOST =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || exit 1
[[ $DEPLOY_USER =~ ^[a-z_][a-z0-9_-]*$ ]] || exit 1
[[ $DEPLOY_PORT =~ ^[0-9]+$ ]] && ((10#$DEPLOY_PORT > 0 && 10#$DEPLOY_PORT < 65536)) || exit 1
[[ $DEPLOY_PATH =~ ^/[A-Za-z0-9_./-]+$ && $DEPLOY_PATH != *..* ]] || exit 1
[[ $GITHUB_SHA =~ ^[a-f0-9]{40}$ ]] || exit 1
[[ $DEPLOY_URL =~ ^https://[A-Za-z0-9.-]+/?$ ]] || exit 1

remote="${DEPLOY_USER}@${DEPLOY_HOST}"
ssh_options=(-p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
remote_tmp=$(ssh "${ssh_options[@]}" "$remote" 'mktemp -d /tmp/kidbridge-deploy.XXXXXXXX')
[[ $remote_tmp =~ ^/tmp/kidbridge-deploy\.[A-Za-z0-9]+$ ]] || exit 1
trap 'ssh "${ssh_options[@]}" "$remote" "rm -rf -- $remote_tmp" || true' EXIT

scp -P "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
  site.tar.gz scripts/activate-server.py "$remote:$remote_tmp/"
receipt=$(ssh "${ssh_options[@]}" "$remote" \
  "python3 $remote_tmp/activate-server.py $DEPLOY_PATH $remote_tmp/site.tar.gz $GITHUB_SHA")
[[ $receipt =~ ^[a-f0-9]{32}$ ]] || { echo 'Unexpected deployment receipt' >&2; exit 1; }

verified=false
for attempt in 1 2 3 4; do
  if curl --fail --silent --show-error --max-time 20 \
       "${DEPLOY_URL%/}/kidbridge-release.json?commit=$GITHUB_SHA" -o /tmp/kidbridge-release-check.json &&
     python3 -c 'import json,os; assert json.load(open("/tmp/kidbridge-release-check.json"))["commit"] == os.environ["GITHUB_SHA"]' &&
     curl --fail --silent --show-error --max-time 20 "${DEPLOY_URL%/}/" -o /tmp/kidbridge-live.html &&
     grep -q 'id="growthEntry"' /tmp/kidbridge-live.html &&
     node tests/navigation/production.mjs; then
    verified=true
    break
  fi
  sleep 5
done
if [[ $verified != true ]]; then
  echo 'Online verification failed; restoring the previous release.' >&2
  ssh "${ssh_options[@]}" "$remote" \
    "python3 $remote_tmp/activate-server.py --rollback $DEPLOY_PATH $receipt"
  exit 1
fi
echo "Deployed and verified $GITHUB_SHA; rollback receipt: $receipt"
