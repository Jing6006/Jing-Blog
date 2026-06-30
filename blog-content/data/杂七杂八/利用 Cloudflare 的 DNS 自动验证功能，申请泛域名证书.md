# References

[说明・acmesh-official/acme.sh Wiki](https://github.com/acmesh-official/acme.sh/wiki/说明)
[dnsapi · acmesh-official/acme.sh Wiki — dnsapi · acmesh-official/acme.sh Wiki](https://github.com/acmesh-official/acme.sh/wiki/dnsapi#dns_cf)

# 前置条件

1. 有服务器
2. 有域名
3. 域名设置到 Cloudflare

# 优点

1. 泛域名省事，nginx 通配
2. 自动延长证书有效期

# 设置 DNS



![image](https://cdn3.ldstatic.com/optimized/4X/4/0/d/40d6046dd0e543b156763752e7a5a6f9e1d616a3_2_345x105.png)

image769×235 8.25 KB



# 准备 `CF_Zone_ID` 和 `CF_Token`

## 准备 `CF_Zone_ID`

位置在对应域名的概述窗格下，cloudflare 前端界面可能会改变，图片仅供参考。

![image](https://cdn3.ldstatic.com/optimized/4X/d/f/9/df903c15bf212af4f6b46249de9a4ec822a807e6_2_517x266.png)

image2451×1262 247 KB



## 准备 `CF_Token`



![image](https://cdn3.ldstatic.com/optimized/4X/e/8/c/e8c931bb1806dedf82cbb3df371dcf7effc63a20_2_517x279.png)

image2323×1255 202 KB



> select `Zone -> DNS -> Edit`, and under Zone Resources, only choose the domain we need.

大概像这样，确定后保存好 `CF_Token`

![image](https://cdn3.ldstatic.com/optimized/4X/4/3/4/434374ca3965bc0fa746eec15aa270a7953638ff_2_517x258.png)

image1636×820 39.9 KB



# 申请

## 安装 acme

在服务器上，以 Ubuntu 为例。

```bash
sudo apt update
sudo apt install socat
curl https://get.acme.sh | sh -s email=example@outlook.com
source .bashrc
acme.sh -h
```

最后一步能显示，说明安装成功。

## 安装证书

```bash
export CF_Token="**************"
export CF_Zone_ID="*************"
# 申请证书
# zyhq.de换成自己的域名
acme.sh --issue --dns dns_cf -d zyhq.de -d '*.zyhq.de'
```

`/etc/nginx/ssl` 属主是 root, acme.sh 以用户 zyhq 运行，写不进去，需要把目录属主改成当前用户 zyhq。

```bash
# zyhq换成自己的用户名
sudo chown -R zyhq:zyhq /etc/nginx/ssl
# 安装证书
# zyhq.de换成自己的域名
acme.sh --install-cert -d zyhq.de \
  --key-file       /etc/nginx/ssl/zyhqde_key.pem \
  --fullchain-file /etc/nginx/ssl/zyhqde_cert.pem \
  --reloadcmd      "sudo service nginx reload"
```

以 nginx 为例，其余参考最上面的 references.

完成。