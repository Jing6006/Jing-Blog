---
title: volatile 能保证什么，不能保证什么
date: 2025-05-29 08:57:00
updated: 2025-05-29 09:22:00
tags:
  - java
categories:
  - Java 基础
description: volatile 解决可见性和有序性，不保证复合操作原子性。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: volatile-visibility-ordering
---

这篇我想按“排查记录”来写，主题是 **volatile 能保证什么，不能保证什么**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

volatile 解决可见性和有序性，不保证复合操作原子性。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 状态标记适合 volatile
- count++ 仍然不是原子操作
- 需要原子性时考虑锁或 Atomic 类

## 带入一个排查场景

用 volatile boolean 控制后台任务停止。

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

- [java.util.concurrent 包文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [ThreadPoolExecutor API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)