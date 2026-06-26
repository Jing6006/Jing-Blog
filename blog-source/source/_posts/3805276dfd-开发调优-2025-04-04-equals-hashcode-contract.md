---
title: equals 和 hashCode 为什么必须一起看
date: 2025-03-28 13:05:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - Java 基础
description: 理解对象相等性在集合中的契约。
cover: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80
abbrlink: equals-hashcode-contract
synced_from_content_repo: true
source_path: 开发调优/2025-04-04-equals-hashcode-contract.md
---

这篇我想按“排查记录”来写，主题是 **equals 和 hashCode 为什么必须一起看**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

理解对象相等性在集合中的契约。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- equals 相等则 hashCode 必须相等
- 参与比较的字段应尽量稳定
- 实体类不要随意把数据库主键和业务唯一键混用

## 带入一个排查场景

写一个错误 hashCode 的对象放进 HashSet，再观察 contains 结果。

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

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
