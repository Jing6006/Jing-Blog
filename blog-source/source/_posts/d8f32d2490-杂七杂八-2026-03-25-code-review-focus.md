---
title: 代码 Review 时我会重点看什么
date: 2026-03-19 19:33:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
  - testing
categories:
  - 杂七杂八
description: Review 不是挑刺，而是提前发现设计和维护问题。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: code-review-focus
synced_from_content_repo: true
source_path: 杂七杂八/2026-03-25-code-review-focus.md
source_hash: 18d7f110a4dd52dd43416df2a9bbfbd1321e1982
---

这篇我想按“排查记录”来写，主题是 **代码 Review 时我会重点看什么**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

Review 不是挑刺，而是提前发现设计和维护问题。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 先看需求是否实现
- 再看边界和异常
- 最后看命名和重复代码

## 带入一个排查场景

按清单 Review 一个新增接口。

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

- [Maven Documentation](https://maven.apache.org/guides/)
- [Git Documentation](https://git-scm.com/doc)
