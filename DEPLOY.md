# 部署说明

当前采用 Hexo 静态构建，然后由服务器上的 Nginx 托管。

## 本地构建

```bash
npm run clean
npm run build
```

## 同步到服务器

```bash
rsync -avz --delete public/ root@39.105.9.115:/var/www/jing-dev-notes/
```

如果没有 `rsync`，可以使用 SFTP 上传 `public/` 目录里的全部文件。

## 后台服务

服务器源码目录：

```text
/opt/jing-blog
```

后台由 systemd 托管，服务名：

```text
jing-blog-admin
```

常用命令：

```bash
systemctl status jing-blog-admin
systemctl restart jing-blog-admin
journalctl -u jing-blog-admin -f
```
