# Jing's Blog 项目交接与重部署说明

这份文档给后续维护者或 AI 使用，用来在本地继续写文章、重新构建静态站点，或者在服务器到期后换机重部署。

## 项目概览

- 项目类型：Hexo 静态博客，主题为 Butterfly。出处：`package.json` 的 `hexo.version`、`dependencies.hexo-theme-butterfly`，以及 `_config.yml` 的 `theme: butterfly`。
- 当前站点地址：`http://39.105.9.115`。出处：`_config.yml` 的 `url` 字段。
- Git 远程仓库：`https://github.com/Jing6006/Jing-Blog.git`。出处：本地 `git remote -v`。
- 主要内容目录：`date/`。运行 `npm run content:sync` 后，会同步生成到 `source/_posts/`。
- 生成目录：`public/`。出处：`_config.yml` 的 `public_dir: public`，且 `.gitignore` 会忽略该目录。

## 本地目录职责

- `date/`：长期写作目录，建议以后新增文章优先放这里。
- `source/_posts/`：Hexo 实际读取的文章目录，其中 `date-*.md` 是脚本生成文件。
- `source/about/index.md`：关于页面。
- `source/css/custom.css`：站点视觉定制。
- `source/js/custom.js`：归档搜索、分类计数和访问上报等前端逻辑。
- `scripts/sync-content.js`：把 `date/` 同步到 `source/_posts/`，并生成 `source/date-categories.json`。
- `admin/`：本地/服务器后台管理服务，入口脚本见 `package.json` 的 `admin` 命令。

## 当前内容分类规则

文章分类收口为以下三类：

- `开发调优`：Java、Spring、JVM、并发、数据库、缓存、架构、测试、工程实践等偏开发和排障的文章。
- `资源荟萃`：Linux 部署、Nginx、Docker、工具链、教程和资料整理。
- `杂七杂八`：项目复盘、博客搭建、阶段总结和暂时不适合归入前两类的内容。

注意：`scripts/sync-content.js` 会优先读取文章 frontmatter 中的 `categories`，所以移动文章后也要同步修改 frontmatter。

## 常用命令

```bash
npm install
npm run content:sync
npm run build
npm run server -- --port 4000
```

说明：

- `npm run build` 实际会先执行 `npm run content:sync`，再执行 `hexo generate`。出处：`package.json` 的 `scripts.build`。
- 本地后台命令是 `npm run admin`。后台默认端口来自 `admin/server.js` 中的 `ADMIN_PORT || 4010`。
- 后台账号、密码哈希、会话密钥等配置放在 `.env`，该文件被 `.gitignore` 忽略，不应提交。

## 新服务器重部署流程

1. 在新服务器安装 Node.js、npm、Nginx 和 Git。
2. 克隆仓库：`git clone https://github.com/Jing6006/Jing-Blog.git /opt/jing-blog`。
3. 进入项目目录后安装依赖：`npm install`。
4. 构建静态站点：`npm run build`。
5. 将 Nginx 的静态根目录指向项目的 `public/`，或把 `public/` 同步到服务器静态目录。
6. 如果继续使用后台管理，创建 `.env`，配置 `ADMIN_USER`、`ADMIN_PASSWORD_HASH`、`SESSION_SECRET` 等敏感值。
7. 用 systemd 托管后台服务，服务名可以继续沿用 `jing-blog-admin`。该服务名出处：`DEPLOY.md`。

当前旧部署文档里记录过服务器源码目录 `/opt/jing-blog`、旧静态目录 `/var/www/jing-dev-notes/` 和后台服务 `jing-blog-admin`。这些信息出处：`DEPLOY.md`。

## 当前本地自动部署方式

本机 `.git/hooks/post-commit` 和 `.git/hooks/pre-push` 会把当前提交通过 `git archive` 传到服务器，并执行远端命令：

```text
/usr/local/bin/jing-blog-deploy-archive
```

这个 hook 使用 `.git/hooks/jing_blog_deploy` 作为 SSH key。`.git/hooks/` 不属于仓库内容，换机器或重装后需要重新生成和配置部署凭据。不要把私钥、`.env`、`admin/data/` 或 `admin/uploads/` 提交到仓库；这些路径的忽略规则见 `.gitignore`。

如果要在新服务器复刻当前部署方式，可以在服务器上准备一个接收归档并构建的脚本，逻辑大致是：

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/jing-blog
STATIC_DIR=/var/www/jing-dev-notes

mkdir -p "$APP_DIR" "$STATIC_DIR"
tar -xf - -C "$APP_DIR"
cd "$APP_DIR"
npm install
npm run build
rsync -a --delete public/ "$STATIC_DIR"/
systemctl restart jing-blog-admin || true
```

实际路径可以按新服务器调整，但要同步更新 Nginx 配置和本地 git hook。

## 后台与访问统计

- 文章页会向 `/track/view` 上报访问。出处：`source/js/custom.js`。
- 后台统计数据保存在 `admin/data/analytics.json`。出处：`README.md` 和 `.gitignore`。
- `admin/data/` 不提交到 Git，新服务器如果需要保留历史统计，需要从旧服务器单独备份迁移。

## 维护注意事项

- 改完 `date/` 后运行 `npm run content:sync`，确认 `source/date-categories.json` 只出现目标分类。
- 改 CSS 或 JS 后，如果线上缓存不刷新，可以递增 `_config.butterfly.yml` 里 `inject` 的资源版本号。
- 不要手改 `source/_posts/date-*.md`，它们会被同步脚本覆盖。
- 提交前建议跑 `npm run build`，确认 Hexo 能完整生成。
- 如果线上访问量没有变化，优先检查后台服务、`/track/view` 路由和 Nginx 反向代理。
