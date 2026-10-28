"""Install a static release into an existing server document root, preserving unrelated files."""
import argparse
import json
import os
import pathlib
import shutil
import tarfile
import tempfile
import uuid

ENTRY_FILES = {'index.html', 'learning.html', 'kidbridge-release.json'}


def target_root(value):
    root = pathlib.Path(value)
    if not root.is_absolute() or len(root.parts) < 4 or '..' in root.parts:
        raise ValueError('Use the full, dedicated website root directory')
    if root.is_symlink() or not root.is_dir():
        raise ValueError('Website root must already exist and must not be a symlink')
    return root.resolve()


def destination(root, name):
    path = root / name
    if any(p.is_symlink() for p in [path, *path.parents] if p != root.parent):
        raise ValueError('Refusing to write through symlinks')
    if not path.resolve().is_relative_to(root):
        raise ValueError('Destination escapes website root')
    return path


def replace_file(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix='.kidbridge-', dir=target.parent)
    os.close(fd)
    try:
        shutil.copyfile(source, temporary)
        os.chmod(temporary, 0o644)
        os.replace(temporary, target)
    finally:
        pathlib.Path(temporary).unlink(missing_ok=True)


def rollback(root, receipt, check_current=True):
    if len(receipt) != 32 or any(c not in '0123456789abcdef' for c in receipt):
        raise ValueError('Invalid rollback receipt')
    backup = root.parent / (root.name + '.kidbridge-backups') / receipt
    manifest = json.loads((backup / 'manifest.json').read_text())
    if manifest['root'] != str(root):
        raise ValueError('Backup belongs to another website')
    marker = root / 'kidbridge-release.json'
    if check_current and (not marker.exists() or json.loads(marker.read_text())['commit'] != manifest['commit']):
        raise ValueError('Website has changed since this release; refusing rollback')
    for entry in reversed(manifest['files']):
        target = destination(root, entry['name'])
        if entry['existed']:
            replace_file(backup / 'previous' / entry['name'], target)
        else:
            target.unlink(missing_ok=True)


def activate(root, archive, commit):
    if len(commit) != 40 or any(c not in '0123456789abcdef' for c in commit):
        raise ValueError('Invalid commit SHA')
    backup_root = root.parent / (root.name + '.kidbridge-backups')
    if backup_root.is_symlink():
        raise ValueError('Backup root must not be a symlink')
    backup_root.mkdir(mode=0o700, exist_ok=True)
    receipt = uuid.uuid4().hex
    backup = backup_root / receipt
    backup.mkdir(mode=0o700)
    stage = backup / 'stage'
    stage.mkdir()
    names = set()
    with tarfile.open(archive, 'r:gz') as bundle:
        for member in bundle:
            name = pathlib.PurePosixPath(member.name)
            if name.is_absolute() or '..' in name.parts:
                raise ValueError('Unsafe archive path')
            if str(name) == '.' or member.isdir():
                continue
            if not member.isfile() or str(name) in names:
                raise ValueError('Archive must contain unique regular files')
            if str(name) not in ENTRY_FILES and name.parts[0] not in {'assets', 'static'}:
                raise ValueError('Unexpected file in release: ' + str(name))
            names.add(str(name))
            output = stage / str(name)
            output.parent.mkdir(parents=True, exist_ok=True)
            with bundle.extractfile(member) as source, output.open('wb') as target:
                shutil.copyfileobj(source, target)
    if not ENTRY_FILES.issubset(names):
        raise ValueError('Release is missing required entry files')
    if json.loads((stage / 'kidbridge-release.json').read_text())['commit'] != commit:
        raise ValueError('Release marker does not match commit')
    # Preflight and back up every overwritten file before touching the live tree.
    ordered = sorted(names - ENTRY_FILES) + ['learning.html', 'index.html', 'kidbridge-release.json']
    manifest = {'root': str(root), 'commit': commit, 'files': []}
    for name in ordered:
        target = destination(root, name)
        if target.exists() and not target.is_file():
            raise ValueError('Destination is not a regular file: ' + name)
        existed = target.exists()
        if existed:
            previous = backup / 'previous' / name
            previous.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, previous)
        manifest['files'].append({'name': name, 'existed': existed})
    (backup / 'manifest.json').write_text(json.dumps(manifest))
    try:
        # Upload resources first, then atomically replace each HTML entry.
        for name in ordered:
            replace_file(stage / name, destination(root, name))
    except Exception:
        rollback(root, receipt, check_current=False)
        raise
    return receipt


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root')
    parser.add_argument('archive_or_receipt')
    parser.add_argument('commit', nargs='?')
    parser.add_argument('--rollback', action='store_true')
    args = parser.parse_args()
    root = target_root(args.root)
    if args.rollback:
        rollback(root, args.archive_or_receipt)
    else:
        print(activate(root, args.archive_or_receipt, args.commit))
