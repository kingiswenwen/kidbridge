"""Refresh network evidence; cloud HTTP checks never establish mainland access."""
import concurrent.futures
import datetime
import json
import pathlib
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITES = json.loads(re.search(r'const SITES = (\[.*?\]);', (ROOT / 'navigation.html').read_text(), re.S)[1])
previous = json.loads((ROOT / 'docs/site-access-evidence.json').read_text())
prior = {s['id']: s for s in previous['sites']}

def get_json(url):
    response = subprocess.run(['curl', '--fail', '--silent', '--show-error',
                               '--max-time', '20', url], capture_output=True, text=True, check=True)
    return json.loads(response.stdout)

def check(site):
    result = prior[site['id']].copy()
    parsed = urllib.parse.urlsplit(site['url'])
    urls = [site['url'].rstrip('/')]
    origin = f'{parsed.scheme}://{parsed.netloc}'
    if origin not in urls:
        urls.append(origin)
    result['greatfire'] = []
    for target in urls:
        endpoint = 'https://en.greatfire.org/api/url/' + target.replace('://', '/', 1)
        record = {'testedUrl': target, 'source': endpoint}
        try:
            record['result'] = get_json(endpoint)
        except Exception as error:
            record['error'] = str(error)
        result['greatfire'].append(record)
        data = record.get('result', {})
        if data.get('found') and not data.get('stale') and data.get('conclusions', 0):
            break
    try:
        request = urllib.request.Request(site['url'], headers={'User-Agent': 'Mozilla/5.0 (Kidbridge link check)'})
        with urllib.request.urlopen(request, timeout=15) as response:
            result['cloudCheck'] = {'status': response.status, 'finalUrl': response.url}
            response.read(1024)
    except urllib.error.HTTPError as error:
        result['cloudCheck'] = {'status': error.code, 'error': str(error)}
    except Exception as error:
        result['cloudCheck'] = {'status': None, 'error': str(error)}
    result['assessment'] = result['status']
    result['assessmentSource'] = result['source']
    result['assessmentBasis'] = 'OONI'
    for record in result['greatfire']:
        data = record.get('result', {})
        if not data.get('found') or data.get('stale') or not data.get('conclusions', 0):
            continue
        verdict = data.get('verdict', data.get('headline', '')).lower()
        mapped = {'not blocked': 'observed', 'blocked': 'blocked', 'intermittent': 'mixed', 'partly disrupted': 'mixed'}.get(verdict)
        if mapped:
            old = result['status']
            if (mapped == 'observed' and old == 'anomaly') or (mapped == 'blocked' and old == 'observed'):
                mapped = 'mixed'
            result.update(assessment=mapped, assessmentSource=record['source'], assessmentBasis='GreatFire + OONI')
            break
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results = list(pool.map(check, SITES))
output = {'checkedOn': datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),
          'scope': 'Cloud checks use the managed proxy, not a China mainland direct connection. Mainland classifications use public measurements only.',
          'sites': results}
(ROOT / 'docs/site-access-evidence.json').write_text(json.dumps(output, ensure_ascii=False, indent=2))
for result in results:
    print(result['id'], result['domain'], result['assessment'], result['cloudCheck'].get('status'))
