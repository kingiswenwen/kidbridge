"""Exercise the real deployment shell with isolated, fault-injected transports."""
import json
import os
import pathlib
import subprocess
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).parents[2] / 'scripts/deploy-server.sh'
SHA = 'a' * 40
STUB = r'''#!/usr/bin/env python3
import json, os, pathlib, signal, sys
kind = pathlib.Path(sys.argv[0]).name
args = sys.argv[1:]
root = pathlib.Path(os.environ['FAKE_ROOT'])
config = json.loads((root / 'config.json').read_text())
if kind == 'ssh':
    command = args[-1]
    if 'mktemp -d' in command: kind = 'connect'
    elif '--rollback' in command: kind = 'rollback'
    elif '--receipt' in command: kind = 'activate'
    elif command.startswith('rm -rf'): kind = 'cleanup'
    else: raise RuntimeError(command)
with (root / 'calls.jsonl').open('a') as log:
    log.write(json.dumps({'kind': kind, 'args': args, 'artifacts': os.environ.get('PRODUCTION_SMOKE_ARTIFACTS')}) + '\n')
state = root / (kind + '.count')
count = int(state.read_text()) + 1 if state.exists() else 1
state.write_text(str(count))
failures = config.get(kind, [])
code = failures[min(count - 1, len(failures) - 1)] if failures else 0
if kind == config.get('interrupt_during'):
    os.kill(int(os.environ['SCRIPT_PID']), signal.SIGTERM)
if code:
    if kind == 'connect' and config.get('failed_connect_output'):
        print(config['failed_connect_output'])
    sys.exit(code)
if kind == 'connect': print(config.get('remote_tmp', '/tmp/kidbridge-deploy.ABC12345'))
if kind == 'activate': print('bad-response' if config.get('bad_receipt') else args[-1].split()[-1])
if kind == 'curl':
    output = pathlib.Path(args[args.index('-o') + 1])
    output.write_text(json.dumps({'commit': 'b' * 40 if config.get('wrong_sha') else os.environ['GITHUB_SHA']}))
'''


class TransportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        for command in ['ssh', 'scp', 'curl', 'node', 'sleep']:
            path = self.bin / command
            path.write_text(STUB)
            path.chmod(0o755)
        self.env = dict(os.environ, PATH=str(self.bin) + os.pathsep + os.environ['PATH'],
                        FAKE_ROOT=str(self.root), DEPLOY_HOST='example.test', DEPLOY_PORT='22',
                        DEPLOY_USER='deploy', DEPLOY_PATH='/www/sites/example.test',
                        DEPLOY_URL='https://example.test', GITHUB_SHA=SHA,
                        GITHUB_STEP_SUMMARY=str(self.root / 'summary.md'))

    def run_deploy(self, config=None):
        (self.root / 'config.json').write_text(json.dumps(config or {}))
        result = subprocess.run(['bash', '-c', 'export SCRIPT_PID=$$; exec bash "$1"', 'test', str(SCRIPT)],
                                cwd=self.root, env=self.env, text=True, capture_output=True, timeout=15)
        self.calls = [json.loads(line) for line in (self.root / 'calls.jsonl').read_text().splitlines()] if (self.root / 'calls.jsonl').exists() else []
        self.report = json.loads((self.root / 'artifacts/deployment/result.json').read_text()) if (self.root / 'artifacts/deployment/result.json').exists() else None
        return result

    def count(self, kind):
        return sum(call['kind'] == kind for call in self.calls)

    def test_success_requires_live_sha_and_browser_verification(self):
        result = self.run_deploy()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.report['stage'], 'verified')
        self.assertEqual(self.count('activate'), 1)
        self.assertEqual(self.count('node'), 1)
        self.assertEqual(self.count('rollback'), 0)
        self.assertEqual(self.count('cleanup'), 1)
        self.assertRegex(self.report['receipt'], r'^[a-f0-9]{32}$')
        self.assertIn('Production deployment: verified', (self.root / 'summary.md').read_text())

    def test_connection_and_upload_recover_from_transport_failure(self):
        result = self.run_deploy({'connect': [255, 0], 'scp': [255, 0]})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.count('connect'), 2)
        self.assertEqual(self.count('scp'), 2)
        self.assertEqual(self.count('activate'), 1)

    def test_connection_retries_are_bounded(self):
        result = self.run_deploy({'connect': [255]})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.count('connect'), 3)
        self.assertEqual(self.count('activate'), 0)

    def test_remote_preflight_failure_is_not_retried(self):
        self.assertNotEqual(self.run_deploy({'connect': [1]}).returncode, 0)
        self.assertEqual(self.count('connect'), 1)
        self.assertEqual(self.count('scp'), 0)

    def test_deterministic_upload_failure_does_not_activate(self):
        self.assertNotEqual(self.run_deploy({'scp': [1]}).returncode, 0)
        self.assertEqual(self.count('scp'), 1)
        self.assertEqual(self.count('activate'), 0)
        self.assertEqual(self.count('cleanup'), 1)

    def test_browser_retries_keep_separate_evidence(self):
        result = self.run_deploy({'node': [1, 1, 0]})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.count('activate'), 1)
        self.assertEqual(self.count('rollback'), 0)
        self.assertEqual([call['artifacts'] for call in self.calls if call['kind'] == 'node'],
                         [f'artifacts/production-smoke/attempt-{i}' for i in range(1, 4)])

    def test_failed_browser_verification_rolls_back_once_and_fails(self):
        self.assertNotEqual(self.run_deploy({'node': [1]}).returncode, 0)
        self.assertEqual(self.count('node'), 3)
        self.assertEqual(self.count('rollback'), 1)
        self.assertEqual(self.report['stage'], 'rolled-back')
        self.assertEqual(self.count('cleanup'), 1)

    def test_wrong_release_sha_is_never_reported_as_success(self):
        self.assertNotEqual(self.run_deploy({'wrong_sha': True}).returncode, 0)
        self.assertEqual(self.count('node'), 0)
        self.assertEqual(self.count('rollback'), 1)
        self.assertEqual(self.report['stage'], 'rolled-back')

    def test_http_outage_rolls_back_after_bounded_verification(self):
        self.assertNotEqual(self.run_deploy({'curl': [28]}).returncode, 0)
        self.assertEqual(self.count('curl'), 3)
        self.assertEqual(self.count('rollback'), 1)

    def test_lost_activation_response_preserves_known_receipt_without_replay(self):
        result = self.run_deploy({'activate': [255]})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.count('activate'), 1)
        self.assertEqual(self.count('rollback'), 0)
        self.assertEqual(self.count('cleanup'), 0)
        self.assertEqual(self.report['stage'], 'activation-unconfirmed')
        self.assertRegex(self.report['receipt'], r'^[a-f0-9]{32}$')
        self.assertIn(self.report['receipt'], result.stderr)

    def test_unexpected_activation_response_preserves_recovery(self):
        self.assertNotEqual(self.run_deploy({'bad_receipt': True}).returncode, 0)
        self.assertEqual(self.report['stage'], 'activation-unconfirmed')
        self.assertEqual(self.count('cleanup'), 0)
        self.assertEqual(self.count('rollback'), 0)

    def test_failed_rollback_preserves_recovery_tool_and_reports_failure(self):
        result = self.run_deploy({'node': [1], 'rollback': [255]})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.report['stage'], 'rollback-failed')
        self.assertEqual(self.count('rollback'), 1)
        self.assertEqual(self.count('cleanup'), 0)
        self.assertIn('Rollback could not be confirmed', result.stderr)

    def test_interrupted_verification_rolls_back(self):
        self.assertNotEqual(self.run_deploy({'interrupt_during': 'node', 'node': [1]}).returncode, 0)
        self.assertEqual(self.count('rollback'), 1)
        self.assertEqual(self.report['stage'], 'rolled-back')

    def test_interrupted_activation_preserves_recovery(self):
        result = self.run_deploy({'interrupt_during': 'activate'})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.count('activate'), 1)
        self.assertEqual(self.count('rollback'), 0)
        self.assertEqual(self.count('cleanup'), 0)
        self.assertEqual(self.report['stage'], 'activation-unconfirmed')
        self.assertIn(self.report['receipt'], result.stderr)

    def test_invalid_remote_output_is_never_used_as_cleanup_command(self):
        self.assertNotEqual(self.run_deploy({'remote_tmp': '/tmp/unexpected; touch bad'}).returncode, 0)
        self.assertEqual(self.count('activate'), 0)
        self.assertEqual(self.count('cleanup'), 0)

    def test_failed_connection_output_is_never_used_as_cleanup_command(self):
        result = self.run_deploy({'connect': [255], 'failed_connect_output': '/tmp/unexpected; touch bad'})
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.count('activate'), 0)
        self.assertEqual(self.count('cleanup'), 0)
        self.assertEqual(self.report['remote_directory'], '')

    def test_missing_configuration_fails_before_connecting(self):
        self.env.pop('DEPLOY_HOST')
        result = self.run_deploy()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Missing DEPLOY_HOST', result.stderr)
        self.assertEqual(self.calls, [])


if __name__ == '__main__':
    unittest.main()
