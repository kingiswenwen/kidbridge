import importlib.util
import io
import json
import pathlib
import tarfile
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('deploy', pathlib.Path(__file__).parents[2] / 'scripts/activate-baota.py')
deploy = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deploy)
SHA = 'a' * 40


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.parent = pathlib.Path(self.temp.name)
        self.root = self.parent / 'site'
        self.root.mkdir()
        (self.root / 'index.html').write_text('old home')
        (self.root / '.well-known').mkdir()
        (self.root / '.well-known/token').write_text('keep certificate challenge')
        (self.root / '.user.ini').write_text('keep Baota settings')
        self.bundle = self.parent / 'release.tar.gz'

    def archive(self, extra=None):
        files = {'index.html': 'new home', 'learning.html': 'interactive app',
                 'assets/new.js': 'new JS', 'kidbridge-release.json': json.dumps({'commit': SHA})}
        files.update(extra or {})
        with tarfile.open(self.bundle, 'w:gz') as archive:
            for name, content in files.items():
                data = content.encode()
                member = tarfile.TarInfo(name)
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))

    def test_release_and_rollback_preserve_existing_site_settings(self):
        (self.root / 'assets').mkdir()
        (self.root / 'assets/old.js').write_text('keep old loaded clients working')
        self.archive()
        receipt = deploy.activate(self.root, self.bundle, SHA)
        self.assertEqual((self.root / 'index.html').read_text(), 'new home')
        self.assertTrue((self.root / 'assets/old.js').exists())
        deploy.rollback(self.root, receipt)
        self.assertEqual((self.root / 'index.html').read_text(), 'old home')
        self.assertFalse((self.root / 'learning.html').exists())
        self.assertFalse((self.root / 'assets/new.js').exists())
        self.assertTrue((self.root / '.well-known/token').exists())
        self.assertEqual((self.root / '.user.ini').read_text(), 'keep Baota settings')

    def test_rejects_traversal_before_updating_homepage(self):
        self.archive({'../escape': 'bad'})
        with self.assertRaises(ValueError):
            deploy.activate(self.root, self.bundle, SHA)
        self.assertEqual((self.root / 'index.html').read_text(), 'old home')
        self.assertFalse((self.parent / 'escape').exists())

    def test_rejects_symlinked_asset_directory(self):
        outside = self.parent / 'outside'
        outside.mkdir()
        (self.root / 'assets').symlink_to(outside, target_is_directory=True)
        self.archive()
        with self.assertRaises(ValueError):
            deploy.activate(self.root, self.bundle, SHA)
        self.assertFalse((outside / 'new.js').exists())

    def test_partial_copy_failure_restores_previous_files(self):
        self.archive()
        original = deploy.replace_file
        failed = False

        def fail_once(source, target):
            nonlocal failed
            if target.name == 'index.html' and not failed:
                failed = True
                raise OSError('simulated disk failure')
            return original(source, target)

        with patch.object(deploy, 'replace_file', side_effect=fail_once):
            with self.assertRaises(OSError):
                deploy.activate(self.root, self.bundle, SHA)
        self.assertEqual((self.root / 'index.html').read_text(), 'old home')
        self.assertFalse((self.root / 'learning.html').exists())

    def test_rollback_will_not_overwrite_a_later_release(self):
        self.archive()
        receipt = deploy.activate(self.root, self.bundle, SHA)
        (self.root / 'kidbridge-release.json').write_text(json.dumps({'commit': 'b' * 40}))
        with self.assertRaises(ValueError):
            deploy.rollback(self.root, receipt)


if __name__ == '__main__':
    unittest.main()
