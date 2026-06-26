---
title: 线程池参数应该怎么设置
date: 2025-06-07 09:12:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - Java 基础
description: 从任务类型、响应时间和资源限制倒推线程池。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: thread-pool-parameters
synced_from_content_repo: true
source_path: Java 基础/2025-06-08-thread-pool-parameters.md
---

今天把 **线程池参数应该怎么设置** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

从任务类型、响应时间和资源限制倒推线程池。

## 我这次真正记住的点

- CPU 密集和 IO 密集思路不同
- 队列长度决定堆积方式
- 线程命名便于排查

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：给导出任务设计一个独立线程池。

## 先留一段能跑的东西

```java
ExecutorService pool = new ThreadPoolExecutor(
    4,
    8,
    60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),
    new ThreadFactoryBuilder().setNameFormat("export-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [java.util.concurrent 包文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [ThreadPoolExecutor API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)
