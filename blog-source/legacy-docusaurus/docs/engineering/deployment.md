---
title: 部署发布
---

部署发布专栏用来记录服务器初始化、构建、发布、回滚和监控。

## 当前博客发布流程

```bash
npm run build
rsync -av build/ root@server:/var/www/blog/
```

后续可以继续升级成 GitHub Actions、Gitea Actions 或服务器上的自动拉取部署。
