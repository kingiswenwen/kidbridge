# GitHub → 宝塔自动部署

现状：仓库历史未发现自动部署配置；域名当前提供的是旧版静态文件。这与手动上传构建包的方式一致，无法仅凭仓库确认服务器配置。

此工作流在 PR 时构建和测试，合并或推送到 `main` 后自动部署，也可在 Actions 手动运行。推送到其他分支不会更新线上网站。

## 一次性连接配置

在宝塔 **网站 → kidbridge.wynsunny.cn → 设置 → 网站目录** 确认实际根目录。不要根据域名猜目录。部署用户需要该目录及其父目录的写权限，服务器需有 Python 3.9+、SSH/SFTP；无需在服务器安装 Node.js。建议使用专门的非 root 部署用户。

在仓库 **Settings → Secrets and variables → Actions** 配置以下 Repository variables：

| 名称 | 值 |
| --- | --- |
| `DEPLOY_HOST` | 已核实的服务器 IP 或 SSH 主机名 |
| `DEPLOY_PORT` | 实际 SSH 端口，例如 `22` |
| `DEPLOY_USER` | 能写入网站目录和父目录的 SSH 用户 |
| `DEPLOY_PATH` | 已确认的站点绝对根目录，不含空格；不能填 `/`、共享网站父目录或软链接 |

配置以下 Repository secrets：

| 名称 | 内容 |
| --- | --- |
| `DEPLOY_SSH_KEY` | 专用于此仓库的 SSH 私钥；对应公钥须加入部署用户的 `~/.ssh/authorized_keys` |
| `DEPLOY_KNOWN_HOSTS` | 已核对指纹的服务器 SSH 公钥记录，格式与 `known_hosts` 相同 |

不要把密码、私钥提交到仓库或聊天。`ssh-keyscan -p 实际端口 实际主机` 可获取公钥记录，但必须与服务器宝塔终端上的 `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`（或实际主机密钥类型）输出核对指纹。非 22 端口的记录主机名应为 `[主机]:端口`。部署启用严格主机验证，不自动信任未知服务器。

本聊天的 GitHub 授权无法读取或管理 Actions Secrets/Variables（HTTP 403），当前云环境也没有 SSH 配置、SSH agent 或已绑定服务器凭据。必须先完成上述接入，才能在服务器核查目录并实际部署。配置缺失时，工作流会明确失败，不会显示部署成功。

服务器安全组/防火墙必须允许 GitHub 托管 runner 连接实际 SSH 端口。如果服务器仅允许固定 IP，不建议为此放开所有来源，可改用与服务器可达的专用 self-hosted runner；那需要单独设置和隔离。

## 首次上线

1. 填好上述配置，确认服务器目录为这个静态网站的专用目录，完成一次备份。
2. 合并此工作流的 PR 到 `main`。之后进入 **Actions → Build and deploy to Baota** 查看执行结果。
3. 工作流安装锁定依赖（仅在 runner 临时副本中将 npmmirror 下载地址换为官方 npm 地址）、执行类型检查和部署测试、构建完整 H5 包。
4. 经 SSH 上传后，先备份被覆盖的文件，再更新资源，最后逐个原子替换首页入口；保留旧哈希资源、`.well-known`、`.user.ini` 及其他非构建文件。不会修改 Nginx、宝塔设置、SSL 证书或其他网站。
5. 请求 `https://kidbridge.wynsunny.cn/kidbridge-release.json?commit=提交SHA`，核对实际线上 SHA，并检查首页存在互动学习入口。验证失败时尝试自动恢复旧文件，并将 Actions 标记为失败。

首页、互动入口和资源文件不是整个目录的原子切换；备份和回退避免了删除旧站点，但发生服务器断电等外部故障时仍需人工处理。若启用 CDN，必须对 HTML 和 `kidbridge-release.json` 关闭长缓存或配置刷新，否则版本验证可能失败并回退。仍需人工验收外部站点的视频和游戏，不属于本工作流检查范围。

## 备份与回退

每次上线的回退凭据会显示在 Actions 日志中。旧文件保存在站点目录旁的 `<站点目录名>.kidbridge-backups/<凭据>/previous`；该目录不在网站根目录内。脚本不自动删除这些备份，需定期检查磁盘空间。

服务器保留 `scripts/activate-baota.py` 的可信副本后，可执行：

```bash
python3 activate-baota.py --rollback /实际/网站/根目录 回退凭据
```

回退只允许恢复当前版本对应的备份，不会覆盖后来已部署的新版本。也可通过 GitHub revert 提交后走完整部署流程。
