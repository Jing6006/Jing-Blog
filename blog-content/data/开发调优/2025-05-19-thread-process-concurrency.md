---
title: 线程、进程和并发问题的基本认识
date: 2025-05-19 21:44:00
updated: 2025-05-19 22:23:00
tags:
  - java
categories:
  - Java 基础
description: 先区分执行单元，再讨论共享资源。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: thread-process-concurrency
---

今天把 **线程、进程和并发问题的基本认识** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

先区分执行单元，再讨论共享资源。

## 我这次真正记住的点

- 进程隔离资源
- 线程共享进程内存
- 并发问题来自共享可变状态

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：用两个线程同时累加同一个计数器，观察错误结果。

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