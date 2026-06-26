# 部署说明

当前服务器部署方式：

- Web 服务：Nginx
- 站点目录：`/var/www/jing-dev-notes`
- 访问地址：`http://39.105.9.115/`

## 手动发布流程

```bash
npm run build
```

然后把 `build/` 目录内容同步到服务器：

```bash
rsync -avz --delete build/ root@39.105.9.115:/var/www/jing-dev-notes/
```

如果本机没有 `rsync`，也可以使用支持 SFTP 的工具上传 `build/` 目录内容。

## 后续建议

- 给服务器配置 SSH key 登录。
- 修改 root 密码，并逐步关闭密码登录。
- 绑定域名后配置 HTTPS。
- 文章内容稳定后再接入评论、统计和站内搜索。
