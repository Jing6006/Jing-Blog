## 一、部署 Render Web Service

### 1. 注册并创建服务

首先使用谷歌账号注册 [Render](https://render.com/)，然后选择 **New Web Services**。



![创建 Web Service](https://cdn3.ldstatic.com/optimized/4X/0/6/b/06babc315723f1ca1a66c7dc497e3d4a427cf611_2_690x328.png)

创建 Web Service1920×915 86.5 KB



### 2. 配置 Docker 镜像

填入镜像地址：`eceasy/cli-proxy-api:latest`



![配置镜像](https://cdn3.ldstatic.com/optimized/4X/1/8/f/18f46d1f76455d3ea0982d3bb57860a487a810db_2_690x327.png)

配置镜像1920×910 50.6 KB



### 3. 配置环境变量

在部署配置中，需要填写以下环境变量：

- **DEPLOY**: 填写 `cloud`
- **MANAGEMENT_PASSWORD**: 设置访问密码
- **PGSTORE_DSN**: 数据库连接字符串（下一步获取）



![环境变量配置](https://cdn3.ldstatic.com/optimized/4X/9/f/8/9f8ddcc59dbb592e5bead4e260b3dcfa7bb7bded_2_690x182.png)

环境变量配置1847×489 25.5 KB



------

## 二、配置 Supabase 数据库

### 4. 创建 Supabase 项目

登录 [Supabase](https://supabase.com/)，点击新建项目。



![新建项目](https://cdn3.ldstatic.com/optimized/4X/0/c/c/0ccc710a436b7f45039238a02d06b64f4e4b1c49_2_690x327.png)

新建项目1920×912 40.4 KB



项目名称、密码和区域可以根据需要填写。

![连接数据库](https://cdn3.ldstatic.com/optimized/4X/9/3/7/93779d818e84487fc0319da01776db04f55b0b2d_2_690x301.png)

连接数据库1897×830 65.3 KB



### 5. 获取数据库连接字符串

项目创建完成后，点击 **Connect** 按钮。

![选择 Direct 模式](https://cdn3.ldstatic.com/optimized/4X/5/5/d/55d5e1e3c2003914f73d6d7104bd2f0161be740b_2_690x328.png)

选择 Direct 模式1920×914 74.1 KB



### 6. 选择连接模式

在连接方式中选择 **Direct**。



![复制连接字符串](https://cdn3.ldstatic.com/optimized/4X/4/f/d/4fdadb6a21fd2eca88f4f0a78e1c931a0f12ea61_2_690x366.png)

复制连接字符串1920×1020 98.5 KB



### 7. 复制并修改连接字符串

复制显示的 URL，然后进行以下修改：

1. 将 `[YOUR-PASSWORD]` 替换为你设置的实际密码
2. 在 URL 末尾添加：`?sslmode=require&default_query_exec_mode=simple_protocol`



![填写 DSN](https://cdn3.ldstatic.com/optimized/4X/1/8/c/18c82b15596d3aeefa1e35869b57565df41de2d1_2_690x328.jpeg)

填写 DSN1920×915 112 KB



**最终格式示例：**

```perl
postgresql://postgres.xxxxx:your-password@aws-0-region.supabase.com:5432/postgres?sslmode=require&default_query_exec_mode=simple_protocol
```

### 8. 填写 DSN 并部署

将修改后的连接字符串填入 Render 的 **DSN** 环境变量中。

点击 **Deploy** 开始部署。



![开始部署](https://cdn3.ldstatic.com/optimized/4X/0/b/b/0bb77168a75203585ad38a47f556a7af92f2fecb_2_690x329.png)

开始部署1920×916 42.7 KB



------

## 三、配置 Cloudflare Worker 保活脚本

为了防止 Render 免费服务休眠，可以使用 Cloudflare Worker 定期访问服务。

### 9. 部署保活脚本

在 Cloudflare Workers 中创建新的 Worker，使用以下代码：

```javascript
// Cloudflare Worker 脚本

// 需要保活的域名列表
const DOMAINS = [
  '这里填入render给的域名',
];

export default {
  // 定时触发器，每天执行一次
  async scheduled(event, env, ctx) {
    console.log(`[${new Date().toISOString()}] 开始执行保活任务`);
    
    const results = await Promise.allSettled(
      DOMAINS.map(async (domain) => {
        try {
          const response = await fetch(domain, {
            method: 'GET',
            headers: {
              'User-Agent': 'Cloudflare-Worker-Bot',
              'Cache-Control': 'no-cache'
            },
            cf: {
              cacheTtl: 0
            }
          });

          const status = response.ok ? 'success' : 'failed';
          console.log(`[${new Date().toISOString()}] ${domain}: ${status} (${response.status})`);
          
          return {
            domain,
            status,
            statusCode: response.status,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error(`[${new Date().toISOString()}] ${domain}: error - ${error.message}`);
          return {
            domain,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      })
    );

    console.log(`[${new Date().toISOString()}] 保活任务完成`);
    return results;
  },

  // HTTP请求处理，用于手动触发和查看状态
  async fetch(request, env, ctx) {
    try {
      const results = await Promise.allSettled(
        DOMAINS.map(async (domain) => {
          try {
            const response = await fetch(domain, {
              method: 'GET',
              headers: {
                'User-Agent': 'Cloudflare-Worker-Bot',
                'Cache-Control': 'no-cache'
              },
              cf: {
                cacheTtl: 0
              }
            });

            return {
              domain,
              status: response.ok ? 'success' : 'failed',
              statusCode: response.status,
              timestamp: new Date().toISOString()
            };
          } catch (error) {
            return {
              domain,
              status: 'error',
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        })
      );

      return new Response(JSON.stringify({
        status: 'completed',
        results: results.map(r => r.value),
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
```