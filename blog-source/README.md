# Jing's Blog

基于 Hexo + Butterfly 的个人技术博客。

## 本地开发

```bash
npm install
npm run server
```

## 构建

```bash
npm run build
```

构建产物位于 `public/`。

## 后台管理

```bash
npm run admin
```

后台默认运行在 `http://127.0.0.1:4010/login`。账号、密码哈希和会话密钥放在 `.env` 中，参考 `.env.example`。

后台包含文章管理、站点设置和访问统计。文章页会向 `/track/view` 上报访问记录，统计数据保存在 `admin/data/analytics.json`，该目录不会提交到 Git。

## 写文章

```bash
npx hexo new "文章标题"
```

文章文件会生成到 `source/_posts/`。

也可以直接在写作目录里写 Markdown。这个目录已经纳入当前博客 Git 仓库：

```text
D:\Student\Java\博客\hexo-blog\date
```

为了日常打开方便，本机也保留了这个入口：

```text
D:\Student\Java\博客\date
```

这个目录下的一级或多级文件夹会自动作为分类。例如：

```text
D:\Student\Java\博客\date\个人开发\我的工具.md
```

会同步为 `个人开发` 分类下的一篇文章。

手动同步：

```bash
npm run content:sync
```

本地监听同步：

```bash
npm run content:watch
```

常用提交流程：

```bash
git add .
git commit -m "新增文章"
git push
```
