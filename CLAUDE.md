# 博客项目交接说明

这个目录现在只保留两套核心结构：

## 1. 源码目录

- 路径：`D:\Student\Java\博客\blog-source`
- 用途：Hexo 博客源码、主题、构建、部署相关逻辑

重要说明：

- 文章内容**不要**直接手改 `blog-source\source\_posts`
- `source\_posts` 是同步生成目录，不是内容主仓库
- 构建命令在 `blog-source\package.json`
- 构建前会先执行内容同步：
  - `npm run content:sync`
- 默认内容来源脚本：
  - `blog-source\scripts\sync-content.js`
- 默认监听脚本：
  - `blog-source\scripts\watch-content.js`

## 2. 内容仓库

- 路径：`D:\Student\Java\博客\blog-content`
- 用途：只存博客 markdown 内容
- 这是单独 Git 仓库

内容主目录：

- `D:\Student\Java\博客\blog-content\data\Java 基础`
- `D:\Student\Java\博客\blog-content\data\后端框架`
- `D:\Student\Java\博客\blog-content\data\数据库与中间件`
- `D:\Student\Java\博客\blog-content\data\杂七杂八`

规则：

- 博客正文优先改这里
- 一个 md 文件就是一篇文章
- front matter 保留 Hexo 所需字段，如：
  - `title`
  - `date`
  - `updated`
  - `tags`
  - `categories`
  - `description`
  - `cover`
  - `abbrlink`

## 当前内容流转方式

1. 内容写在 `blog-content\data\分类名\*.md`
2. 执行 `blog-source` 下的 `npm run content:sync`
3. 内容被同步到 `blog-source\source\_posts`
4. 执行 `npm run build` 生成 Hexo 静态站点

## 已知约定

- 当前分类已经收口为 4 个：
  - `Java 基础`
  - `后端框架`
  - `数据库与中间件`
  - `杂七杂八`
- 已存在约 100 篇文章
- 发布时间已经做成不规则节奏

## 不要再踩的坑

1. 不要把文章直接生成到旧的根目录 `date`
   - 这个旧入口已经废弃

2. 不要把文章主内容只放在 `source\_posts`
   - 那里是同步结果，不是主编辑区

3. 不要把命令脚本放在 `blog-source\scripts` 里随便新增 `.js/.mjs`
   - Hexo 可能把它们当脚本加载
   - 命令型工具脚本优先放 `blog-source\tools`

4. `blog-source\legacy-docusaurus` 是旧站遗留归档
   - 先不要乱删
   - 除非用户明确要求清理

## 常用路径

- 源码：`D:\Student\Java\博客\blog-source`
- 内容：`D:\Student\Java\博客\blog-content`
- 内容分类根目录：`D:\Student\Java\博客\blog-content\data`
- 同步脚本：`D:\Student\Java\博客\blog-source\scripts\sync-content.js`
- 构建工具：`D:\Student\Java\博客\blog-source\tools`

## 推荐工作方式

- 改文章：先改 `blog-content\data`
- 改展示和主题：改 `blog-source`
- 改完后在 `blog-source` 执行：
  - `npm run build`

## Git 与自动部署

- 当前总仓库根目录：`D:\Student\Java\博客`
- 当前远程仓库：`https://github.com/lijing6006/Jing-Blog.git`
- 正常流程：
  1. 修改 `blog-content\data\分类名\*.md`
  2. 在 `D:\Student\Java\博客` 执行 `git add .`
  3. `git commit`
  4. `git push origin main`
  5. 服务器自动检测更新并重新部署

## 服务器自动部署现状

服务器信息与部署约定：

- 站点地址：`http://39.105.9.115/`
- 服务器源码根目录：`/opt/jing-blog`
- 实际 Hexo 工作目录：`/opt/jing-blog/blog-source`
- 静态站点目录：`/var/www/jing-dev-notes`
- 后台服务：`jing-blog-admin.service`
- 自动同步服务：`jing-blog-sync.service`
- 自动同步定时器：`jing-blog-sync.timer`
- 自动部署脚本：`/usr/local/bin/jing-blog-sync`

自动部署机制：

- 服务器不会直接依赖 `git fetch`
- 当前改为检查 GitHub tarball 的 ETag 是否变化
- 有变化就重新下载仓库、恢复 `.env` 和 `admin/data`、执行构建、发布静态文件
- 定时器按分钟轮询

## 服务器维护注意事项

1. 不要随便删除服务器上的：
   - `/opt/jing-blog/blog-source/.env`
   - `/opt/jing-blog/blog-source/admin/data`
   - `/opt/jing-blog/blog-source/admin/uploads`

2. 如果自动部署异常，优先排查：
   - `systemctl status jing-blog-sync.timer`
   - `systemctl status jing-blog-sync.service`
   - `journalctl -u jing-blog-sync.service -n 200 --no-pager`
   - `systemctl status jing-blog-admin`

3. 如果你只是改 md 内容，原则上不需要手动登录服务器
