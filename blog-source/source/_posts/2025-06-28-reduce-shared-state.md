---
title: 并发场景下如何减少共享状态
date: 2025-06-29 10:51:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - Java 基础
description: 很多并发问题不是靠加锁解决，而是靠减少共享。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: reduce-shared-state
synced_from_content_repo: true
source_path: Java 基础/2025-06-28-reduce-shared-state.md
---

今天把 **并发场景下如何减少共享状态** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

很多并发问题不是靠加锁解决，而是靠减少共享。

## 我这次真正记住的点

- 不可变对象天然更安全
- 局部变量优先于成员变量
- 队列能把并发写变成串行消费

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：把批量处理任务改成每个任务独立上下文。

## 先留一段能跑的东西

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [java.util.concurrent 包文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [ThreadPoolExecutor API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
