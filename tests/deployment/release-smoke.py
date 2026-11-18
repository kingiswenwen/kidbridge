"""Install the real build artifact and exercise production checks without SSH."""
import functools
import http.server
import os
import pathlib
import subprocess
import sys
import tempfile
import threading
import uuid


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def main():
    archive = pathlib.Path('site.tar.gz').resolve()
    commit = os.environ['GITHUB_SHA']
    with tempfile.TemporaryDirectory(prefix='kidbridge-release-') as directory:
        root = pathlib.Path(directory) / 'site'
        root.mkdir()
        receipt = uuid.uuid4().hex
        installed = subprocess.check_output([
            sys.executable, 'scripts/activate-server.py', str(root), str(archive),
            commit, '--receipt', receipt,
        ], text=True).strip()
        if installed != receipt:
            raise RuntimeError('Activation did not return the expected receipt')
        handler = functools.partial(QuietHandler, directory=str(root))
        with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            env = dict(os.environ, DEPLOY_URL=f'http://127.0.0.1:{server.server_port}/',
                       PRODUCTION_SMOKE_ARTIFACTS='artifacts/release-smoke')
            try:
                subprocess.run(['node', 'tests/navigation/production.mjs'],
                               env=env, check=True, timeout=180)
            finally:
                server.shutdown()
                thread.join()


if __name__ == '__main__':
    main()
