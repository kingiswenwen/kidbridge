"""Render reviewed public network evidence into the static directory and report."""
import collections
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
page = (ROOT / 'navigation.html').read_text()
sites = json.loads(re.search(r'const SITES = (\[.*?\]);', page, re.S)[1])
by_id = {site['id']: site for site in sites}
evidence = json.loads((ROOT / 'docs/site-access-evidence.json').read_text())
labels = {'observed': '大陆 · 有直连记录', 'blocked': '大陆 · 有阻断记录', 'mixed': '大陆 · 访问不稳定', 'anomaly': '大陆 · 存在访问异常', 'unknown': '大陆 · 缺少测量，待验证'}
notes = {}
report = ['# 彩虹桥导航站点访问检查', '', '核查日期：2026-10-28（北京时间）。', '',
'对 50 个导航链接进行了云环境 HTTP 请求检查，全部返回 HTTP 200。该环境通过代理联网，结果不代表大陆直连，也未验证完整游戏、登录、视频、音频功能。', '',
'大陆访问依据为 OONI 中国探针公开测量（2026-07-28 至 2026-10-29，每域名最多最近 10 条）与 GreatFire 当前返回的近 90 天结论。保留测试日期、数量和来源；根域名结果不保证具体路径或嵌入资源可用。', '',
'有直连记录表示测量时部分大陆网络可连接，不保证所有运营商与时间。阻断记录表明直连存在障碍，可考虑合规的替代网络，但本次没有逐站对比 VPN 连接，也不能保证 VPN 可解决地区授权或账号限制。未知站点不得强行归类。', '']
counts = collections.Counter(item['assessment'] for item in evidence['sites'])
report += [f"汇总：有直连记录 {counts['observed']} 个；有阻断记录 {counts['blocked']} 个；访问不稳定 {counts['mixed']} 个；待验证 {counts['unknown']} 个。", '', '| 网站 | 大陆访问参考 | 最新有效测量日期 | 来源 |', '| --- | --- | --- | --- |']
for item in evidence['sites']:
    status = item['assessment']
    source = item['assessmentSource']
    records = [g for g in item['greatfire'] if g.get('result', {}).get('found') and not g['result'].get('stale') and g['result'].get('conclusions', 0)]
    if records:
        record = records[0]
        data = record['result']
        date = data.get('last_tested', '')[:10]
        prefix = f"{date} · GreatFire {data['conclusions']} 条有效结论；测量入口 {record['testedUrl']}。"
        source = source.replace('/api/url/', '/')
    else:
        dates = [x['measurement_start_time'][:10] for x in item['measurements'] if x.get('measurement_start_time')]
        date = max(dates) if dates else '—'
        prefix = f'{date} · OONI {len(dates)} 条记录。' if dates else '公开测量不足，不能判断是否需要 VPN。'
    suffix = {'observed': '可先尝试国内直连；视频和游戏需要另测。', 'blocked': '存在大陆直连阻断记录；未对 VPN 效果作保证。', 'mixed': '测量显示连接不稳定，可能因网络、地区或时间而异。', 'anomaly': '连接有异常，尚不能确认具体原因。', 'unknown': ''}[status]
    if item['id'] in [31, 43]:
        suffix += ' 部分视频依赖外部平台，网页可开不代表视频可播。'
    notes[item['id']] = {'access': status, 'accessSource': source, 'accessNote': prefix + suffix}
    report.append(f"| {by_id[item['id']]['name']} | {labels[status]} | {date} | [GreatFire / OONI]({source}) · [OONI 原始查询]({item['source']}) |")
page = re.sub(r'const ACCESS_LABELS=.*?;\nconst ACCESS_DATA=.*?;\nSITES.forEach\(s=>Object.assign\(s,ACCESS_DATA\[s.id\]\)\);',
              lambda _: 'const ACCESS_LABELS=' + json.dumps(labels, ensure_ascii=False) + ';\nconst ACCESS_DATA=' + json.dumps(notes, ensure_ascii=False) + ';\nSITES.forEach(s=>Object.assign(s,ACCESS_DATA[s.id]));', page, flags=re.S)
if 'value="blocked"' not in page:
    page = page.replace('<option value="anomaly">存在访问异常</option>', '<option value="blocked">有阻断记录</option><option value="anomaly">存在访问异常</option>')
page = page.replace('不同网络结果不一</option>', '访问不稳定</option>')
page = page.replace('.access-status.anomaly,.access-status.mixed', '.access-status.blocked,.access-status.anomaly,.access-status.mixed')
page = page.replace('大陆访问参考近三个月 OONI 公开测量', '大陆访问参考 OONI 和 GreatFire 公开测量')
(ROOT / 'navigation.html').write_text(page)
(ROOT / 'docs/site-access-report.md').write_text('\n'.join(report) + '\n')
print(dict(counts))
