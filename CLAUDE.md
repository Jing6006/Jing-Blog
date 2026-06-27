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
---

## 2026-06-27 分类问题与重建规划

### 这次用户真实诉求

- 首页分类显示必须和点进去的分类详情完全一致
- 分类数、分类列表、分类详情页文章数必须是同一套数据
- `开发调优` 这类分类不能再出现“首页显示 77，点进去只有 2 到 3 篇”的问题
- 如果旧项目难以继续维护，接受直接重建，但要先整理完整功能清单

### 已确认的根因

- 当前项目历史上同时存在多套分类口径：
  - Hexo 真正生成的分类页
  - `source/date-categories.json`
  - `source/js/custom.js` 里前端二次改写分类 DOM 的逻辑
- 这会导致首页侧栏、分类总页、分类详情页彼此不一致
- `blog-content/data/开发调优` 目录下的文章很多，但旧逻辑里目录分类、frontmatter 分类、前端统计分类并没有彻底收口为同一份来源

### 已做过的处理结论

- `blog-source/scripts/sync-content.js` 已尝试改成按内容目录归类
- `blog-source/source/js/custom.js` 已尝试截断 `updateDateCategories()`，避免继续读取 `date-categories.json` 改 DOM
- `blog-source/public/categories/开发调优/index.html` 本地构建结果已经出现多页分页，不再只是 2 到 3 篇
- 但旧缓存、旧部署、历史逻辑交织，继续在旧项目上打补丁的维护成本已经偏高

### 后续建议

- 不要再继续增加新的“分类同步补丁”
- 如果要继续维护旧项目，必须先统一一条规则：
  - 分类只允许来自一个地方
  - 只能二选一：`frontmatter categories` 或 `目录分类`
- 更推荐直接重建博客项目，并把旧文章迁移过去

### 重建时必须保留的功能

#### 第一优先级：必须有

- 文章系统：文章列表、详情、Markdown 渲染、代码高亮、摘要、封面、发布时间、更新时间
- 分类系统：分类列表、分类详情、分类计数；首页、分类页、详情页共用同一套分类数据
- 标签系统：标签列表、标签详情、标签计数
- 归档系统：按年月归档、支持分页
- 首页：最新文章列表、分页、作者卡片、最新文章、分类、归档
- 搜索：站内全文搜索
- 关于页
- 留言页 / 留言板
- 后台：登录、文章管理、图片上传、站点设置、重新构建
- 部署：本地构建、线上发布、静态资源版本控制

#### 第二优先级：建议有

- 草稿和发布状态
- 文章置顶
- SEO 基础能力：`sitemap`、`robots.txt`、OG 信息
- 评论或留言审核
- 图片管理
- 404 页面
- 访问统计后台

### 重建时必须遵守的技术约束

- 分类只保留一条数据链路，禁止前端再次读取 JSON 去改分类显示
- 首页、分类总页、侧栏分类卡片、后台统计必须走同一份聚合函数
- 不再保留 `date-categories.json` 这种和真实分类页可能冲突的第二数据源
- 后台直接编辑真实内容源，不再维护“写一份、同步一份、前端再算一份”的三套口径
- 所有缓存版本号必须从单一配置输出

### 给下一任模型的建议操作顺序

1. 先判断是继续修旧项目还是直接重建
2. 如果重建，先给出：
   - 技术选型
   - 目录结构
   - 数据模型
   - 页面清单
   - 后台清单
   - 旧文章迁移方案
3. 如果继续修旧项目，先删除或彻底废弃前端分类重写逻辑，再统一分类来源，最后再处理部署和缓存
