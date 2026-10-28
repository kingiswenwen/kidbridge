# 参与彩虹桥

感谢你帮助孩子和家长找到更合适的学习内容。无论是修正一道题、补充一个教育资源，还是改善移动端体验，都欢迎通过 Issue 或 Pull Request 参与。

## 从哪里开始

| 想做的事 | 主要位置 |
| --- | --- |
| 补充或修正资源导航 | `navigation.html` 中的 `SITES` 数据与页面交互 |
| 维护链接核验记录 | `docs/site-access-evidence.json`、`scripts/render-site-access.py` |
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

反馈外部资源时，再补充资源名称、类别、适用年龄、语言和收费方式。链接问题请注明检查日期、具体地址、浏览器中的表现，以及是首页还是某个具体音视频或游戏无法打开。

## 资源与链接核验

优先说明资源适合谁、可以学什么、是否需要账号或付费。描述应基于实际页面和可核对来源，避免把导航收录写成合作或官方推荐。

```bash
python3 scripts/check-site-access.py
python3 scripts/render-site-access.py
```

前者对当前目录逐项进行 HTTP GET，记录状态、跳转地址和页面标题；后者生成维护报告，不向页面添加访问标签。验证页、证书错误和动态页面需要浏览器复核。HTTP 200 也可能是关闭公告或不相关内容，不能只看状态码决定收录。

确认无法进入内容、服务关闭或内容不符后，从 `navigation.html` 的 `SITES` 中移除条目，并在 `docs/site-access-evidence.json` 中保留核验与移除依据。保留现有条目的 ID，避免破坏已保存的收藏。新增资源也需要完成链接与内容核验。目录数量和分类计数由页面自动计算。

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
