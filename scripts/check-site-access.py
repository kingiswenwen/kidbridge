"""Check current directory URLs without assigning regional access labels.

Run from the repository with:
    python3 scripts/check-site-access.py

This only updates the evidence file. Review failures in a browser before
editing the directory; an HTTP verification page is not proof a site is dead.
"""
import argparse
import concurrent.futures
import datetime
import html
import json
import pathlib
import re
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]


def check(site, timeout):
    result = {key: site[key] for key in ('id', 'name', 'url')}
    result['included'] = True
    request = urllib.request.Request(site['url'], headers={
        'User-Agent': 'Mozilla/5.0 (compatible; KidbridgeLinkCheck/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Encoding': 'identity',
    })
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(300000).decode('utf-8', errors='replace')
            title = re.search(r'<title[^>]*>(.*?)</title>', body, re.I | re.S)
            result['http'] = {
                'status': response.status, 'finalUrl': response.url,
                'title': html.unescape(re.sub(r'\s+', ' ', title[1]).strip()) if title else '',
            }
    except urllib.error.HTTPError as error:
        result['http'] = {'status': error.code, 'finalUrl': error.url, 'error': str(error)}
    except Exception as error:
        result['http'] = {'status': None, 'error': str(error)}
    title = result['http'].get('title', '')
    result['needsReview'] = not (
        result['http'].get('status') == 200
        and not re.search(r'just a moment|human verification|not found|access denied', title, re.I)
    )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--timeout', type=float, default=18)
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--output', type=pathlib.Path, default=ROOT / 'docs/site-access-evidence.json')
    args = parser.parse_args()
    if args.timeout <= 0 or not 1 <= args.workers <= 16:
        parser.error('timeout must be positive; workers must be between 1 and 16')
    page = (ROOT / 'navigation.html').read_text()
    sites = json.loads(re.search(r'const SITES = (\[.*?\]);', page, re.S)[1])
    previous = json.loads(args.output.read_text()) if args.output.exists() else {}
    removed = [item for item in previous.get('sites', []) if not item.get('included', True)]
    current_ids = {item['id'] for item in sites}
    removed = [dict(item, lastCheckedOn=previous.get('checkedOn')) for item in removed if item['id'] not in current_ids]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda site: check(site, args.timeout), sites))
    output = {
        'checkedOn': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),
        'method': 'HTTP GET for current directory URLs. Browser review is required for failures and JavaScript-rendered or verification pages. Removed entries retain their previous check date. No regional classifications are generated.',
        'summary': {'checked': len(results), 'included': len(sites), 'removed': len(removed)},
        'sites': results + removed,
    }
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    for result in results:
        print(result['name'], result['http'].get('status'), '需要复核' if result['needsReview'] else 'OK')


if __name__ == '__main__':
    main()
