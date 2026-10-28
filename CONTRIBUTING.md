# 参与彩虹桥

感谢你帮助孩子和家长找到更合适的学习内容。无论是修正一道题、补充一个教育资源，还是改善移动端体验，都欢迎通过 Issue 或 Pull Request 参与。

## 从哪里开始

| 想做的事 | 主要位置 |
| --- | --- |
| 补充或修正资源导航 | `navigation.html` 中的 `SITES` 数据与页面交互 |
| 调整资源访问提示 | `docs/site-access-evidence.json`、`scripts/render-site-access.py` |
| 修正数学题或答案 | `src/utils/questionGenerator.ts`、`src/data/levels.ts` |
| 修正拼音、例字或音频 | `src/data/pinyin/`、`src/static/audio/`、`src/pages/pinyin/` |
| 补充英语词汇或日常句子 | `src/data/english/`、`src/pages/english/` |
| 改进界面与学习流程 | `src/pages/`、`src/components/`、`src/styles/` |
| 调整部署与回退 | `.github/workflows/server-deploy.yml`、`scripts/`、`tests/deployment/` |

较大的功能或目录调整，建议先开 Issue 说明使用场景、目标用户和预期行为，便于讨论范围。

## 反馈问题

在 [Issues](https://github.com/kingiswenwen/kidbridge/issues) 中尽量提供：

- 出问题的页面或完整资源链接。
- 浏览器、设备，以及是在 H5 还是小程序上遇到的问题。
- 可以复现问题的操作步骤、预期结果与实际结果；必要时附截图。
- 题目、拼音或翻译问题请附原内容、建议修正和可核对的来源。

反馈外部资源时，再补充资源名称、类别、适用年龄、语言和收费方式。访问问题请注明检查日期、网络地区与运营商、是否使用代理，以及是首页还是某个具体音视频或游戏无法打开。

## 资源与访问数据

优先说明资源适合谁、可以学什么、是否需要账号或付费。描述应基于实际页面和可核对来源，避免把导航收录写成合作或官方推荐。

更新已有资源的公开访问证据时，可以运行：

```bash
python3 scripts/check-site-access.py
python3 scripts/render-site-access.py
```

前者刷新 GreatFire 与当前执行环境的 HTTP 检查，并保留已有 OONI 快照；后者依据证据更新导航与报告。更新 OONI 数据时，需要根据证据文件中的查询地址另行获取公开测量。

检查后同时审阅 `navigation.html`、`docs/site-access-report.md` 与 `docs/site-access-evidence.json` 的差异，保留测量日期和来源。新增网站也应同步补充证据文件中对应的站点记录。代理环境中的 HTTP 200、某次大陆直连或首页可访问，都不足以保证整个站点长期可用；缺少证据时保留“待验证”。

## 提交修改

1. Fork 仓库或在有权限的仓库中创建功能分支，保持一次修改聚焦一个问题。
2. 按 [README](README.md#本地运行) 安装依赖并启动项目。
3. 修改学习页面时，验证导航首页与 `/learning.html#/` 两个入口；界面调整应附上相应截图。
4. 修改应用代码时运行 `npm run type-check` 与 `npm run build:h5`；修改部署脚本时还需运行下面的 Python 测试。
5. 向 `main` 提交 PR，说明解决的问题、最终行为及验证结果。GitHub Actions 会执行完整检查；PR 不部署生产站点，合并到 `main` 后才会发布。

```bash
npm run type-check
python3 -m unittest discover -s tests/deployment -v
npm run build:h5
```

仅修改文档时，核对相对链接、页面入口和命令与仓库是否一致即可；GitHub Actions 仍会按当前工作流执行检查。

## 贡献范围

当前自动检查和在线发布覆盖 H5。小程序或 App 的改动请说明具体平台与验证方式，尤其是音频、存储和导航等平台差异。新增字体、图片、音频或题目素材时，请说明来源与授权信息。
