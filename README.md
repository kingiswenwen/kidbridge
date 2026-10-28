<p align="center">
  <img src="src/static/logo/kidbridge-logo.svg" width="112" alt="彩虹桥 Kidbridge 标志" />
</p>

# 彩虹桥 · Kidbridge

**给孩子一个探索的入口，给家长一个陪伴学习的起点。**

彩虹桥是一款面向亲子学习的 Web 应用：把儿童教育网站整理成可搜索、可筛选的资源导航，同时提供数学、拼音和英语互动练习。内置练习主要面向 3–6 岁启蒙与幼小衔接；资源导航也覆盖更大年龄段，方便家长按兴趣和年龄选择。

[![构建与部署](https://github.com/kingiswenwen/kidbridge/actions/workflows/server-deploy.yml/badge.svg?branch=main)](https://github.com/kingiswenwen/kidbridge/actions/workflows/server-deploy.yml)

[在线体验](https://kidbridge.wynsunny.cn/) · [进入互动学习](https://kidbridge.wynsunny.cn/learning.html#/) · [本地运行](#本地运行) · [参与贡献](CONTRIBUTING.md) · [问题反馈](https://github.com/kingiswenwen/kidbridge/issues)

## 为什么做彩虹桥

陪孩子学习时，常常需要在网站、拼音卡片、口算题和英语素材之间来回寻找。彩虹桥希望把这些入口放在一起：家长可以先挑选适合的资源，再陪孩子做一组练习、听一段发音，或回顾之前的错题。

项目目前由两个可以相互跳转的部分组成：

| 部分 | 可以做什么 | 入口 |
| --- | --- | --- |
| 教育资源导航 | 浏览外部教育网站，按年龄、类别、收费方式和访问情况筛选，搜索并收藏资源 | 网站首页 `/` |
| 互动学习 | 在彩虹桥内进行数学、拼音、英语学习，查看练习记录、错题和收藏 | `/learning.html#/` |

彩虹桥自身的页面和内置练习可直接使用，无需注册。导航收录的网站由各自运营方提供，其中有免费、部分免费和付费资源。

## 已有功能

| 模块 | 当前提供的内容 |
| --- | --- |
| 资源导航 | 50 个教育网站，分为编程与逻辑、低幼启蒙、百科与知识、科学与航天、数学、英文阅读、语言音乐艺术、工具与棋类 8 类；支持搜索、筛选和本地收藏 |
| 数学练习 | 10 / 20 以内加减法与混合练习、数的分解、相邻数、比较大小、应用题、数数和找规律 |
| 拼音学习 | 声母、韵母、拼读、拼音总表、发音与例字、分类练习和拼音收藏 |
| 英语启蒙 | 单词闪卡、日常句子、朗读和选择题练习 |
| 闯关挑战 | 数学关卡、答题结果和星级记录 |
| 学习记录 | 今日答题、正确率、累计学习记录和数学错题回顾 |
| 个性设置 | 昵称、学习阶段、声音、字体等设置，以及学习数据重置 |

独立识字和古诗练习模块目前尚未实现。资源导航中的外部内容与上述内置模块分别维护。

## 怎么使用

1. 打开[资源导航首页](https://kidbridge.wynsunny.cn/)，按孩子的年龄和兴趣筛选，也可以直接搜索网站名称或关键词。
2. 收藏常用资源，下次在同一个浏览器中打开时继续使用。
3. 点击首页右上角的“互动学习”，进入数学、拼音或英语模块；互动学习首页也可以返回资源导航。
4. 从互动学习首页的个人入口查看学习记录、数学错题和拼音收藏，或进入设置调整学习阶段与声音。

家长可以先选一个孩子感兴趣的主题，陪伴完成一小组活动，再根据孩子的反馈调整内容和难度。

### 数据与声音

- 导航收藏保存在当前浏览器的 `localStorage`；互动学习的设置、进度、数学错题和拼音收藏通过 uni-app 本地存储保存。
- 当前没有账号登录或跨设备同步。清除浏览器站点数据、换浏览器或换设备后，原有记录不会自动迁移。
- 拼音页面使用项目内的音频资源；部分朗读使用浏览器语音能力，实际声音与可用性取决于设备和浏览器。小程序端的通用朗读工具目前降级为文字提示。
- 打开导航中的外部网站后，账号、收费和数据处理方式以该网站自身说明为准。

### 资源访问提示

导航中的大陆访问提示来自 **2026-10-28 的公开测量与检查快照**，并非实时监测。“有直连记录”表示曾有对应测量，不保证所有地区、运营商或具体游戏、音视频均可使用。

检查方法、日期和来源见[站点访问报告](docs/site-access-report.md)，原始摘要见[访问证据](docs/site-access-evidence.json)。发现链接失效或访问提示不准确时，欢迎[提交反馈](https://github.com/kingiswenwen/kidbridge/issues)。

## 本地运行

### 环境

- Node.js **24** 与 npm：和当前 GitHub Actions 环境保持一致。
- Python **3.9+**：运行部署脚本测试；开发 H5 页面不依赖 Python。

```bash
git clone https://github.com/kingiswenwen/kidbridge.git
cd kidbridge
npm ci
npm run dev:h5 -- --host 127.0.0.1 --port 5173 --strictPort
```

启动后访问：

| 页面 | 本地地址 |
| --- | --- |
| 资源导航 | <http://127.0.0.1:5173/> |
| 互动学习 | <http://127.0.0.1:5173/learning.html#/> |

### 检查与构建

```bash
# Vue / TypeScript 类型检查
npm run type-check

# 部署文件保留、备份与回退测试
python3 -m unittest discover -s tests/deployment -v

# 构建导航首页与互动学习页面
npm run build:h5
```

H5 输出目录为 `dist/build/h5/`：

```text
dist/build/h5/
├── index.html       # 资源导航，由 navigation.html 打包而来
├── learning.html    # uni-app 互动学习入口
├── assets/          # 编译后的 JavaScript / CSS
└── static/          # 图片、图标和音频等资源
```

可以用 Python 预览构建结果：

```bash
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist/build/h5
```

随后打开 <http://127.0.0.1:4173/>。发布时需要上传整个输出目录，保留两个 HTML 入口和全部资源文件。

## 技术与平台

互动学习使用 **uni-app、Vue 3、TypeScript、Pinia、uview-plus、Tailwind CSS 和 Vite**；资源导航是独立的 HTML / CSS / JavaScript 页面，通过 H5 打包脚本与互动学习一起发布。

| 平台 | 当前状态 |
| --- | --- |
| H5 / Web | 已有在线站点，CI 执行类型检查、部署测试和构建 |
| 微信小程序 | 提供 `npm run dev:mp-weixin` 与 `npm run build:mp-weixin`；需要在 `src/manifest.json` 配置自己的 AppID，并单独验证 |
| App 与其他小程序 | 保留 uni-app 相关配置与部分平台脚本；当前 CI 不承担这些平台的构建验收和发布 |

## 项目结构

```text
├── navigation.html             # 资源导航页面与目录数据
├── src/
│   ├── pages/                  # 数学、拼音、英语、个人页等互动页面
│   ├── components/             # 答题卡、数字键盘、进度与星级等组件
│   ├── data/                   # 拼音、英语、关卡与鼓励语数据
│   ├── stores/                 # 学习进度、设置、错题和收藏状态
│   ├── utils/                  # 出题、语音与本地存储工具
│   └── static/                 # 音频、图标与图片
├── scripts/                    # H5 打包、资源访问检查、部署与回退
├── tests/deployment/           # 部署脚本测试
├── docs/                       # 访问报告和部署文档
└── .github/workflows/          # GitHub Actions 检查与部署流程
```

## 自动检查与部署

PR 提交到 `main` 时，GitHub Actions 会安装锁定依赖，执行类型检查、部署测试和 H5 构建。`main` 已设置必需的 `h5` 检查及分支更新要求；仓库管理员的既有绕过权限仍保留。

合并或推送到 `main` 后，工作流通过专用 SSH 部署账号发布到服务器，核对公网版本标记和首页入口；验证失败时尝试回退。仓库已完成服务器接入，并有一次[成功部署记录](https://github.com/kingiswenwen/kidbridge/actions/runs/40698219394/attempts/2)。

配置位置、密钥用途、上线步骤和回退方法见[服务器 CI/CD 文档](docs/server-cicd.md)。部署信息在 GitHub 仓库设置中管理。

## 参与贡献

欢迎帮助修正题目和拼音发音、补充适龄教育资源、改进移动端体验，或完善跨平台兼容性。开始前请阅读[贡献指南](CONTRIBUTING.md)，了解资源反馈格式、修改位置和提交前检查。

## 相关教育项目

- [GCompris](https://github.com/KDE/gcompris)：面向儿童的综合教育活动软件。
- [ScratchJr](https://github.com/scratchfoundation/scratchjr)：面向低龄儿童的编程启蒙项目。
- [Kolibri](https://github.com/learningequality/kolibri)：支持离线使用的教育平台。

这些项目的 README 为本文的项目定位、使用入口与贡献指南组织方式提供了参考。

## 许可证

仓库目前尚未包含 `LICENSE` 文件，项目许可证由维护者另行确定。第三方依赖与外部网站的内容分别遵循各自的许可证或使用说明。
