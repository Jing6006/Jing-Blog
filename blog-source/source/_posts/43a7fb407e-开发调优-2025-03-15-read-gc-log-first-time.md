---
title: 第一次认真看 GC 日志：我关注了哪些字段
date: 2025-03-13 20:26:00
updated: 2026-06-26 07:16:12
tags:
  - java
  - ops
categories:
  - 开发调优
description: 把 GC 日志当作现象记录，而不是一串看不懂的参数。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: read-gc-log-first-time
synced_from_content_repo: true
source_path: 开发调优/2025-03-15-read-gc-log-first-time.md
source_hash: 382c9334c6456731731b01ffaade304c14a98186
---

这篇我想按“排查记录”来写，主题是 **第一次认真看 GC 日志：我关注了哪些字段**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

把 GC 日志当作现象记录，而不是一串看不懂的参数。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 先看收集器和堆大小
- 再看暂停时间和回收前后容量
- 最后结合接口耗时判断影响

## 带入一个排查场景

给测试服务加上 GC 日志参数，压测后整理一次回收前后变化。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [Java 官方文档](https://docs.oracle.com/en/java/)
- [Java 语言规范](https://docs.oracle.com/javase/specs/)
