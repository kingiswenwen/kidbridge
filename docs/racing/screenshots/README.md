# 赛车成长计划：真实界面截图

以下来自本地 H5 构建和隔离浏览器测试，使用虚构任务与测试数据，不是线上或真实用户记录。图片反映实际实现，不能代替微信真机或 iPhone Safari 验收。

| 页面/状态 | 截图 |
| --- | --- |
| 今日赛道（手机） | [查看](track-mobile.png) |
| 今日赛道（桌面） | [查看](track-desktop.png) |
| 自由冒险日 | [查看](empty-mobile.png) |
| 任务详情与步骤 | [查看](task-mobile.png) |
| 保存后完成反馈 | [查看](completion-mobile.png) |
| 奖励仓库与申请 | [查看](rewards-mobile.png) |
| 我的赛车与换装 | [查看](garage-mobile.png) |
| 家长中心 | [查看](parent-mobile.png) |
| 审核与兑现 | [查看](parent-review-mobile.png) |
| 任务编辑 | [查看](task-editor-mobile.png) |
| 奖励配置 | [查看](reward-editor-mobile.png) |
| 成长记录 | [查看](records-mobile.png) |
| 12 项任务长赛道 | [查看](track-twelve-mobile.png) |

手机主态为 390×844，长列表另检查 320px 窄屏，桌面为 1440×1024。全页截图高度随内容变化。测试代码见 `tests/racing/browser.mjs`；执行 `npm run test:racing:e2e` 可在本机重新生成 `artifacts/racing-browser/` 证据。
