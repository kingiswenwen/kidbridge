"""Render the link-review report; never inject access labels into the website."""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]


def cell(value):
    return str(value or '—').replace('|', '\\|').replace('\n', ' ')


def main():
    evidence = json.loads((ROOT / 'docs/site-access-evidence.json').read_text())
    kept = [item for item in evidence['sites'] if item.get('included', True)]
    removed = [item for item in evidence['sites'] if not item.get('included', True)]
    rows = [
        '# 彩虹桥资源链接核验', '',
        f"本轮核验时间：{evidence['checkedOn']}。", '',
        f"目录保留 {len(kept)} 个网站；本记录包含 {len(removed)} 个已移除条目。", '',
        '对目录链接发起 HTTP GET，并对验证页、证书异常与部分动态页面使用浏览器复核。除 HTTP 状态外，还检查页面是否实际为关闭公告或不相关内容。这里记录的是本次检查结果，不是实时监控；不对使用者的网络作分类。', '',
        '## 保留资源', '',
        '| 网站 | HTTP 状态 | 页面标题 / 浏览器复核 |',
        '| --- | --- | --- |',
    ]
    for item in kept:
        http = item['http']
        browser = item.get('browser', {})
        title = browser.get('title') or http.get('title') or http.get('error')
        detail = f"{title or '—'}；浏览器 {browser['status']}" if browser.get('status') else title
        if item.get('review'):
            detail = f"{detail}；{item['review']}"
        if item.get('needsReview'):
            detail = f'{detail}；本轮需浏览器复核'
        rows.append(f"| [{cell(item['name'])}]({item['url']}) | {cell(http.get('status'))} | {cell(detail)} |")
    rows += ['', '## 已移除条目', '', '| 网站 | 处理依据 |', '| --- | --- |']
    for item in removed:
        date = f"（核验于 {item['lastCheckedOn']}）" if item.get('lastCheckedOn') else ''
        rows.append(f"| {cell(item['name'])} | {cell(item.get('reason'))}{cell(date) if date else ''} |")
    rows += ['', '验证页表示本次未能进入内容，不等同于网站已永久关闭。目录按本次复核结果收录；以后确认恢复时，可以重新核验后加入。', '',
             '## 更新记录', '', '```bash', 'python3 scripts/check-site-access.py', 'python3 scripts/render-site-access.py', '```', '',
             '检查工具只更新记录，不自动删除网站。人工复核后调整 `navigation.html` 的目录数据，并同步维护本证据文件中的收录决定。报告生成器不会向页面添加验证标签或访问提示。', '']
    (ROOT / 'docs/site-access-report.md').write_text('\n'.join(rows))


if __name__ == '__main__':
    main()
