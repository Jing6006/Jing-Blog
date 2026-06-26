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

