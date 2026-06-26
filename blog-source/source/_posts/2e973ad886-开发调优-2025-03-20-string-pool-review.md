---
title: String、StringBuilder 和字符串常量池复盘
date: 2025-03-16 10:51:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - Java 基础
description: 理解字符串不可变、拼接优化和常量池的边界。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: string-pool-review
synced_from_content_repo: true
source_path: 开发调优/2025-03-20-string-pool-review.md
---

这篇我想按“排查记录”来写，主题是 **String、StringBuilder 和字符串常量池复盘**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

理解字符串不可变、拼接优化和常量池的边界。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- String 不可变便于共享
- 循环拼接优先考虑 StringBuilder
- intern 不是日常业务优化手段

## 带入一个排查场景

比较循环中直接拼接和 StringBuilder 的字节码或耗时。

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
