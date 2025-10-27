
import argparse, json, os, re, glob, sys

SEMVER_RE = re.compile(r'index_v(\d+)_(\d+)_(\d+)\.html$', re.I)

def parse_ver(name):
    m = SEMVER_RE.search(os.path.basename(name))
    if not m:
        return None
    return tuple(int(x) for x in m.groups())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--user', required=True)
    ap.add_argument('--repo', required=True)
    ap.add_argument('--manifest', default='update_v12_0_5.json')
    args = ap.parse_args()

    files = sorted(glob.glob('index_v*.html'))
    candidates = [(parse_ver(f), f) for f in files]
    candidates = [c for c in candidates if c[0] is not None]
    if not candidates:
        print('No versioned index_v*.html files found.', file=sys.stderr)
        sys.exit(0)

    candidates.sort(key=lambda x: x[0], reverse=True)
    (maj, minor, patch), fname = candidates[0]
    latest = f"{maj}.{minor}.{patch}"

    manifest = {
        "latest_version": latest,
        "file": f"https://{args.user}.github.io/{args.repo}/{fname}",
        "hash": "",
        "filename": fname,
        "changelog": f"Auto-published by CI. Latest file: {fname}"
    }

    with open(args.manifest, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Manifest written to {args.manifest}: {manifest}")

if __name__ == '__main__':
    main()
