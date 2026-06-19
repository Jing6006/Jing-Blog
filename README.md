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

## 写文章

```bash
npx hexo new "文章标题"
```

文章文件会生成到 `source/_posts/`。
