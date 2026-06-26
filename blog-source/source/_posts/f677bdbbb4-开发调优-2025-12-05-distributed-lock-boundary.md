---
title: 分布式锁应该注意哪些边界
date: 2025-11-30 21:44:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 锁只解决互斥，不自动保证业务正确。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: distributed-lock-boundary
synced_from_content_repo: true
source_path: 开发调优/2025-12-05-distributed-lock-boundary.md
---

今天把 **分布式锁应该注意哪些边界** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

锁只解决互斥，不自动保证业务正确。

## 我这次真正记住的点

- 锁要有过期时间
- 释放锁要校验持有者
- 业务执行超时要考虑续期或失败

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：用 Redis 锁保护优惠券发放。

## 先留一段能跑的东西

```java
String key = "order:" + orderId;
Order cached = redisTemplate.opsForValue().get(key);
if (cached != null) {
    return cached;
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [Redis Docs](https://redis.io/docs/latest/)
- [Redis Commands](https://redis.io/docs/latest/commands/)
