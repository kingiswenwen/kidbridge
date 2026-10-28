# kidbridge
免费、干净、无广告的 3–6 岁彩虹桥儿童启蒙学习工作台（识字/拼音/数学/英语/古诗）

H5 首页现为儿童教育资源导航：`navigation.html`。原互动学习通过右上角“互动学习”进入，地址为 `/learning.html#/`，学习首页可返回资源导航。搜索、年龄/收费/访问筛选与浏览器本地收藏均在导航页内完成。

开发：`npm run dev:h5 -- --host 0.0.0.0 --port 5173 --strictPort`。

构建：`npm run build:h5`，输出 `dist/build/h5`。构建后的 `index.html` 为独立导航页，`learning.html` 为原 uni-app 页面；发布时须上传整个目录。此入口调整仅用于 H5，小程序页面保持原样。

国内访问依据与限制见 [访问核对报告](docs/site-access-report.md)，原始公开测量摘要见 `docs/site-access-evidence.json`。页面中的官网可获取状态来自上传清单，不能当作国内实测结果。访问数据为 2026-10-28 的静态快照，不是实时监测。

本次交叉核对 OONI 与 GreatFire：18 个站点有大陆直连记录，Scratch 有阻断记录，CodeCombat 访问不稳定，30 个站点缺少有效测量。未逐站验证 VPN 效果。刷新访问证据可运行 `python3 scripts/check-site-access.py`，再运行 `python3 scripts/render-site-access.py` 更新导航与报告。前者刷新 GreatFire 与云环境 HTTP 检查，保留现有 OONI 快照；如需更新 OONI，应根据证据文件内的查询地址另行获取。

GitHub Actions → 宝塔自动部署配置与首次接入见 [宝塔 CI/CD](docs/baota-cicd.md)。实际连接服务器并上线前，必须配置 SSH 密钥、可信主机记录和准确的网站根目录。
