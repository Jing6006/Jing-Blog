---
title: 缓存一致性不能只靠删除缓存
date: 2025-11-26 16:18:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 缓存一致性要结合读写路径、失败重试和容忍时间。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: cache-consistency
synced_from_content_repo: true
source_path: 数据库与中间件/2025-11-30-cache-consistency.md
---

这篇我想按“排查记录”来写，主题是 **缓存一致性不能只靠删除缓存**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

缓存一致性要结合读写路径、失败重试和容忍时间。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 先更新数据库再删缓存是常见选择
- 删除失败要补偿
- 强一致场景不要轻易加缓存

## 带入一个排查场景

设计商品价格更新后的缓存删除和消息补偿。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```java
String key = "order:" + orderId;
Order cached = redisTemplate.opsForValue().get(key);
if (cached != null) {
    return cached;
}
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [Redis Docs](https://redis.io/docs/latest/)
- [Redis Commands](https://redis.io/docs/latest/commands/)
