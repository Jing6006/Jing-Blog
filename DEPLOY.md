# 部署速查

更完整的项目交接、换服务器重部署、目录说明和安全注意事项见 `PROJECT_HANDOFF.md`。

## 本地构建

```bash
npm install
npm run build
```

`npm run build` 会先同步 `date/` 文章，再执行 Hexo 静态构建。出处：`package.json` 的 `scripts.build`。

## 本地预览

```bash
npm run server -- --port 4000
```

## 当前线上信息

- 站点地址：`http://39.105.9.115`。出处：`_config.yml` 的 `url` 字段。
- 服务器源码目录：`/opt/jing-blog`。
- 静态目录：`/var/www/jing-dev-notes/`。
- 后台服务名：`jing-blog-admin`。

服务器目录和服务名来自旧部署记录；如果服务器已重装或迁移，请以新机器实际配置为准。

## 后台服务

```bash
systemctl status jing-blog-admin
systemctl restart jing-blog-admin
journalctl -u jing-blog-admin -f
```

后台敏感配置放在 `.env`，访问统计和上传数据分别在 `admin/data/`、`admin/uploads/`，这些路径都不会提交到 Git。出处：`.gitignore`。
