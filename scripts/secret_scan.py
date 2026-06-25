import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_PARTS = {'node_modules', '.git', '.venv', 'dist', '__pycache__'}
SKIP_SUFFIXES = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pyc')

PATTERNS = [
    ('google_maps_key', re.compile(r'AIza[0-9A-Za-z_-]{20,}')),
    ('mongo_uri_with_credentials', re.compile(r'mongodb(?:\+srv)?://[^\s/:]+:[^\s@]+@', re.IGNORECASE)),
    ('private_key_block', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----')),
]


def tracked_files():
    result = subprocess.run(['git', '-c', f'safe.directory={ROOT.as_posix()}', 'ls-files'], cwd=ROOT, check=True, capture_output=True, text=True)
    for line in result.stdout.splitlines():
        path = ROOT / line
        if any(part in SKIP_PARTS for part in path.parts) or path.name.endswith(SKIP_SUFFIXES):
            continue
        yield path


def main():
    findings = []
    for path in tracked_files():
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for line_number, line in enumerate(text.splitlines(), 1):
            for label, pattern in PATTERNS:
                if pattern.search(line):
                    findings.append(f'{path.relative_to(ROOT)}:{line_number}: {label}')
    if findings:
        print('Potential secrets found:')
        print('\n'.join(findings))
        return 1
    print('Secret scan passed: no tracked credentials found.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
