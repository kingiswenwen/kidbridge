# GitHub → 服务器 SSH 自动部署

本流程通过 SSH 直接连接网站服务器并部署静态文件，不依赖任何服务器管理面板。此前手动上传网站包的方式不影响此流程。

日常修改从 `dev` 提交。GitHub Actions 创建或复用 `dev → main` PR，构建与发布包演练均通过后合并。`main` 再构建和部署，并把主分支的新提交同步回 `dev`。也可在 Actions 手动运行生产部署。

## 当前仓库状态

`kingiswenwen/kidbridge` 已完成服务器接入，类型检查、部署测试、H5 构建、SSH 发布和公网版本验证已全部通过，见[成功执行记录](https://github.com/kingiswenwen/kidbridge/actions/runs/40698219394/attempts/2)。日常修改通过 PR 检查后合并到 `main`，即可触发发布；下述一次性设置用于首次接入、迁移或更换部署凭证。

`main` 的必需检查 `h5` 负责构建、回归和打包，并校验 PR 来自本仓库的 `dev`。`Verify release package` 在临时站点安装产物并运行生产验收脚本。两个任务均成功才会尝试合并或部署。工作流通过 GitHub 的常规合并接口执行，GitHub 会继续执行 `main` 的保护规则。

两个工作流统一固定 `ubuntu-24.04`，避免 `ubuntu-latest` 自动升级到项目锁定的 Playwright 不支持的系统。部署和只读线上检查从 `package-lock.json` 读取 Playwright 的确切版本，在隔离目录安装浏览器工具，不重复安装业务依赖。升级 Playwright 时须同时验证 runner 系统的兼容性。

`h5` 在 Playwright 的 Ubuntu 24.04 镜像内运行 Chromium 测试，PR 也会测试 WebKit。发布包演练、线上验收和只读检查在临时 runner 上通过 Ubuntu 官方 HTTPS 软件源安装 Chromium headless shell。apt 请求有超时和重试限制，浏览器安装最多执行 8 分钟。PR 更新时取消过时的检查，`main` 的生产流水线会继续完成发布或恢复流程。

## 启用 dev 自动发布

1. 创建仅限本仓库的细粒度个人访问令牌。令牌需要 `Contents: Read and write` 与 `Pull requests: Read and write`。自动合并的 PR 若包含 GitHub Actions 工作流变更，还需 `Workflows: Read and write`。在 **Settings → Secrets and variables → Actions** 中将凭据保存为 Repository secret `DEV_PROMOTION_TOKEN`。
2. 在 **Settings → Branches** 查看 `main` 的分支保护。保留 **Require a pull request before merging**、必需检查 `h5` 和 **Require branches to be up to date before merging**。如需完全无人值守发布，须让 GitHub 允许这个自动化身份在无需人工批准的情况下合并。个人仓库可以取消该规则里的 **Require approvals**，同时保留 PR 与必需检查。保留强制审核时，GitHub 会等有效批准，批准后重跑失败的合并任务。
3. 初次配置后，推送下一次 `dev` 提交。如果已有 `dev → main` PR，重跑该 PR 的整次工作流，让任务读取新凭据。可以在 **Actions → Keep dev and main in sync** 选择 `dev` 手动运行，补开缺失的 PR。

`DEV_PROMOTION_TOKEN` 用于发起由独立身份触发的 GitHub 事件，确保自动打开的 PR 能触发 CI，合并产生的 `main` 推送也会触发部署。令牌未配置时，工作流会提示自动化尚未启用，已有 PR 仍可运行构建和发布包演练。同步 `dev` 时优先快进，遇到并行开发时保留双方提交。存在合并冲突时 GitHub 会报错，需要在 `dev` 处理后再继续。

## 一次性连接配置

登录服务器，检查该域名对应的 Nginx `server` 配置中的 `root` 指令，确认实际网站根目录。若使用其他 Web 服务器，检查对应的 document root 配置。不要根据域名猜目录。服务器需有 Python 3.9+、SSH/SFTP；无需在服务器安装 Node.js。

使用专门的非 root 部署用户，并授予网站目录及其中资源目录的写权限。部署备份位于网站目录旁的 `<站点目录名>.kidbridge-backups`，可由管理员预先创建并授权给部署用户；这种方式不需要授予共享网站父目录的写权限。当前站点已使用专用部署用户，写权限覆盖本网站和专用备份目录。

在仓库 **Settings → Secrets and variables → Actions** 配置以下 Repository variables：

| 名称 | 值 |
| --- | --- |
| `DEPLOY_HOST` | 已核实的服务器 IP 或 SSH 主机名 |
| `DEPLOY_PORT` | 实际 SSH 端口，例如 `22` |
| `DEPLOY_USER` | 能写入网站目录和专用备份目录的 SSH 用户 |
| `DEPLOY_PATH` | 已确认的站点绝对根目录，不含空格；不能填 `/`、共享网站父目录或软链接 |

配置以下 Repository secrets：

| 名称 | 内容 |
| --- | --- |
| `DEPLOY_SSH_KEY` | 专用于此仓库的 SSH 私钥；对应公钥须加入部署用户的 `~/.ssh/authorized_keys` |
| `DEPLOY_KNOWN_HOSTS` | 已核对指纹的服务器 SSH 公钥记录，格式与 `known_hosts` 相同 |

当前仓库的设置入口为 [Actions Secrets](https://github.com/kingiswenwen/kidbridge/settings/secrets/actions) 和 [Actions Variables](https://github.com/kingiswenwen/kidbridge/settings/variables/actions)。需要登录具有相应仓库权限的 GitHub 账号。

`DEPLOY_SSH_KEY` 是 GitHub 登录部署账号所用的专用钥匙；`DEPLOY_KNOWN_HOSTS` 用于核对目标服务器身份。Secrets 页面只展示名称和更新时间，保存后不能读回原始内容；更换时使用更新操作。Variables 则可查看和编辑具体值。部署凭证保存在仓库设置中，不能写入代码或 README。

不要把密码、私钥提交到仓库或聊天。`ssh-keyscan -p 实际端口 实际主机` 可获取公钥记录，但必须与服务器终端上的 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`（或实际主机密钥类型）输出核对指纹。非 22 端口的记录主机名应为 `[主机]:端口`。部署启用严格主机验证，不自动信任未知服务器。

配置缺失时，工作流会在部署步骤明确失败，并指出缺失的变量或 Secret，不会显示部署成功。已经完成接入的仓库无需为每次提交重复配置。

服务器安全组/防火墙必须允许 GitHub 托管 runner 连接实际 SSH 端口。如果服务器仅允许固定 IP，不建议为此放开所有来源，可改用与服务器可达的专用 self-hosted runner；那需要单独设置和隔离。

## 首次上线

1. 填好上述配置，确认服务器目录为这个静态网站的专用目录，完成一次备份。
2. 合并此工作流的 PR 到 `main`。之后进入 **Actions → Build and deploy to server** 查看执行结果。
3. `h5` 安装锁定依赖（仅在 runner 临时副本中将 npmmirror 下载地址换为官方 npm 地址），执行类型检查、学习核心测试、赛车领域测试、部署故障测试、H5/微信小程序构建、赛车和导航浏览器回归，并上传完整 H5 包。
4. `Verify release package` 下载发布包，在临时目录安装该包并检查首页、六个入口和全部页面，全程不连接生产服务器。
5. 独立部署任务下载**同一次运行、同一 SHA** 的构建包，不重新构建。部署任务串行执行，旧运行重跑时若 `main` 已推进，会在上传前跳过并在摘要注明，避免旧版本覆盖新版本。经 SSH 上传后，先备份被覆盖的文件，再更新资源，最后逐个原子替换首页入口；保留旧哈希资源、`.well-known`、`.user.ini` 及其他非构建文件。不会修改 Web 服务器配置、SSL 证书或其他网站。
6. 请求 `https://kidbridge.wynsunny.cn/kidbridge-release.json?commit=提交SHA`，核对实际线上 SHA，再用浏览器检查首页、六个快捷入口、全部学习页面和图片。浏览器验收每轮最多 180 秒，总共最多 3 轮；失败时尝试自动恢复旧文件，并将 Actions 标记为失败。

连接预检确认服务器 Python 版本和站点目录写权限。SSH 连接初始化和文件上传遇到退出码 255 时最多重试 3 次，间隔 5/10 秒；远端预检失败和普通文件错误直接失败。发布激活和回滚不会盲目重试，避免 SSH 回包丢失时重复修改线上或覆盖原备份。生产任务不会因新提交自动取消；收到可处理的终止信号时，已确认激活但未通过验收的发布会尝试回滚。

私钥和已核对的主机密钥保存在 runner 的专用临时目录，结束时删除，保留严格主机验证。配置缺失在下载和浏览器安装前报告。仅使用仓库已有的部署凭证，不需要重新配置。

首页、互动入口和资源文件不是整个目录的原子切换；备份和回退避免了删除旧站点，但发生服务器断电等外部故障时仍需人工处理。若启用 CDN，必须对 HTML 和 `kidbridge-release.json` 关闭长缓存或配置刷新，否则版本验证可能失败并回退。仍需人工验收外部站点的视频和游戏，不属于本工作流检查范围。

## 备份与回退

每次上线的回退凭据会显示在 Actions 日志中。旧文件保存在站点目录旁的 `<站点目录名>.kidbridge-backups/<凭据>/previous`；该目录不在网站根目录内。脚本不自动删除这些备份，需定期检查磁盘空间。

服务器保留 `scripts/activate-server.py` 的可信副本后，可执行：

```bash
python3 activate-server.py --rollback /实际/网站/根目录 回退凭据
```

回退只允许恢复当前版本对应的备份，不会覆盖后来已部署的新版本。也可通过 GitHub revert 提交后走完整部署流程。

## 失败定位和恢复

在 Actions 中先看失败任务：`h5` 失败表示构建或回归检查未通过；`Verify release package` 失败表示传包、浏览器安装或本地发布演练失败，证据在 `release-smoke-<SHA>-<attempt>` 附件；`Deploy and verify production` 失败表示连接、发布或公网验收失败。生产任务摘要及 `production-navigation-<SHA>-<attempt>` 附件包含 `artifacts/deployment/result.json`；每轮公网验收证据分别保存在 `artifacts/production-smoke/attempt-1` 等目录。重跑仅失败的部署任务可复用原构建包；发布包默认保留 14 天，过期后需重跑构建。旧失败记录不会因新版本修复而自动变绿。

| 阶段 | 处理 |
| --- | --- |
| `connecting` / `uploading` | 尚未激活新版本。检查 SSH 可达性、凭证、目录权限；恢复后可重跑失败部署任务。 |
| `verified` | 当前 SHA 已通过公网浏览器验收。 |
| `rolled-back` | 新版本未通过验收，旧文件已恢复；任务保持失败，查看每轮验收证据。 |
| `activation-unconfirmed` | 激活失败或 SSH 回包丢失，不能仅凭 runner 状态断言线上版本。保留远端工具和预先生成的回退凭据，先人工核对服务器进程及备份。 |
| `rollback-failed` | 回退未能确认，保留工具和备份；必须恢复服务器连接后核对并处理。 |

若出现后两种情况，日志会记录远端临时目录和 32 位回退凭据。服务器备份目录中的 `<凭据>/manifest.json` 记录该次发布 SHA 和被覆盖文件。先确认激活进程已经结束，再检查网站根目录中的 `kidbridge-release.json`；如当前 SHA 对应该凭据，可使用日志保留的工具执行：

```bash
python3 /tmp/kidbridge-deploy.实际目录/activate-server.py --rollback /实际/网站/根目录 32位回退凭据
```

若当前 SHA 已变化、版本标记不完整或回退被拒绝，应由维护者核对 manifest 与备份文件后恢复，不能绕过版本保护覆盖其他发布。网络完全中断、runner 被强制终止或服务器断电时，自动恢复可能无法完成；此时不能把任务改成成功来掩盖问题。

只读的 `Check current live illustrations` 工作流不会部署。它对首次版本读取做有界 HTTP 重试，使用页面实际就绪状态和逐页图片检查；正常页面跳转导致的 `net::ERR_ABORTED` 不作为坏图，但 HTTP 错误、加载失败和页面异常仍会导致检查失败。
