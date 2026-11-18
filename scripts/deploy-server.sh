#!/usr/bin/env bash
# All interpolated remote paths, hashes and receipts are validated locally.
# shellcheck disable=SC2029
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

artifacts=artifacts/deployment
mkdir -p "$artifacts"
browser_check=(node tests/navigation/production.mjs)
if [[ -n ${PLAYWRIGHT_CI_IMAGE:-} ]]; then
  browser_check=(docker run --rm --init --ipc=host
    --volume "$PWD:/workspace" --workdir /workspace
    --env DEPLOY_URL --env GITHUB_SHA --env PRODUCTION_SMOKE_ARTIFACTS
    "$PLAYWRIGHT_CI_IMAGE" "${browser_check[@]}")
fi

remote="${DEPLOY_USER}@${DEPLOY_HOST}"
ssh_common=(-o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
if [[ -n ${DEPLOY_IDENTITY_FILE:-} ]]; then
  ssh_common+=(-i "$DEPLOY_IDENTITY_FILE" -o IdentitiesOnly=yes)
fi
if [[ -n ${DEPLOY_HOSTS_FILE:-} ]]; then
  ssh_common+=(-o "UserKnownHostsFile=$DEPLOY_HOSTS_FILE")
fi
ssh_options=(-p "$DEPLOY_PORT" "${ssh_common[@]}")

# Only repeat connection setup / upload. Never blindly repeat activation: an
# interrupted SSH response does not prove the remote mutation did not happen.
retry_connection() {
  local attempt status
  for attempt in 1 2 3; do
    if "$@"; then return 0; else status=$?; fi
    if [[ $status != 255 || $attempt == 3 ]]; then return "$status"; fi
    echo "SSH connection failed; retry $attempt/2 in $((attempt * 5)) seconds." >&2
    sleep "$((attempt * 5))"
  done
}

remote_tmp=''
receipt=''
activated=false
verified=false
preserve_remote=false
stage=connecting
report() {
  printf '{"commit":"%s","receipt":"%s","remote_directory":"%s","stage":"%s"}\n' "$GITHUB_SHA" "$receipt" "$remote_tmp" "$stage" > "$artifacts/result.json"
  if [[ -n ${GITHUB_STEP_SUMMARY:-} ]]; then
    printf '\n### Production deployment: %s\n\nCommit: %s\n\nRollback receipt: %s\n' "$stage" "$GITHUB_SHA" "$receipt" >> "$GITHUB_STEP_SUMMARY"
  fi
}
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ $activated == true && $verified != true ]]; then
    echo 'Verification failed or interrupted; restoring the previous release.' >&2
    if ssh "${ssh_options[@]}" "$remote" "python3 $remote_tmp/activate-server.py --rollback $DEPLOY_PATH $receipt"; then
      stage=rolled-back
    else
      stage=rollback-failed
      preserve_remote=true
      echo "::error::Rollback could not be confirmed. Recovery tool: $remote_tmp/activate-server.py; receipt: $receipt. See docs/server-cicd.md." >&2
    fi
    status=1
  elif [[ $stage == activating ]]; then
    stage=activation-unconfirmed
    preserve_remote=true
    echo "::error::Activation could not be confirmed. Inspect the release and backup using $remote_tmp/activate-server.py and receipt $receipt before retrying. See docs/server-cicd.md." >&2
  fi
  report
  if [[ -n $remote_tmp && $preserve_remote == false ]]; then
    ssh "${ssh_options[@]}" "$remote" "rm -rf -- $remote_tmp" || true
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

candidate=$(retry_connection ssh "${ssh_options[@]}" "$remote" \
  "python3 -c 'import sys; assert sys.version_info >= (3, 9)' && test -d $DEPLOY_PATH && test -w $DEPLOY_PATH && mktemp -d /tmp/kidbridge-deploy.XXXXXXXX")
if [[ ! $candidate =~ ^/tmp/kidbridge-deploy\.[A-Za-z0-9]+$ ]]; then
  echo '::error::Invalid deployment staging directory.' >&2
  exit 1
fi
remote_tmp=$candidate
stage=uploading
retry_connection scp -P "$DEPLOY_PORT" "${ssh_common[@]}" \
  site.tar.gz scripts/activate-server.py "$remote:$remote_tmp/"

# Know the receipt before activation, even if its SSH response is lost. A
# reused receipt is rejected by the server rather than overwriting its backup.
receipt=$(python3 -c 'import uuid; print(uuid.uuid4().hex)')
stage=activating
report
echo "Activating $GITHUB_SHA; recovery receipt: $receipt"
response=$(ssh "${ssh_options[@]}" "$remote" \
  "python3 $remote_tmp/activate-server.py $DEPLOY_PATH $remote_tmp/site.tar.gz $GITHUB_SHA --receipt $receipt")
if [[ $response != "$receipt" ]]; then
  echo 'Unexpected activation response.' >&2
  exit 1
fi
activated=true
stage=verifying
for attempt in 1 2 3; do
  attempt_dir="artifacts/production-smoke/attempt-$attempt"
  mkdir -p "$attempt_dir"
  if curl --fail --silent --show-error --connect-timeout 10 --max-time 20 \
       "${DEPLOY_URL%/}/kidbridge-release.json?commit=$GITHUB_SHA" -o "$attempt_dir/release.json" &&
     python3 -c 'import json,os,sys; assert json.load(open(sys.argv[1]))["commit"] == os.environ["GITHUB_SHA"]' "$attempt_dir/release.json" &&
     PRODUCTION_SMOKE_ARTIFACTS="$attempt_dir" timeout --signal=TERM --kill-after=15s 180s "${browser_check[@]}"; then
    verified=true
    stage=verified
    break
  fi
  if [[ $attempt != 3 ]]; then sleep 5; fi
done
if [[ $verified != true ]]; then exit 1; fi
echo "Deployed and verified $GITHUB_SHA; rollback receipt: $receipt"
