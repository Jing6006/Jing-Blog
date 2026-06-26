---
title: CompletableFuture 的一次异步编排练习
date: 2025-06-16 14:07:00
updated: 2025-06-16 14:35:00
tags:
  - java
categories:
  - Java 基础
description: 把互不依赖的远程调用并行化，同时控制异常和超时。
cover: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80
abbrlink: completable-future-practice
---

这篇按踩坑笔记来写，因为 **CompletableFuture 的一次异步编排练习** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

把互不依赖的远程调用并行化，同时控制异常和超时。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：并行查询用户信息、积分和优惠券，再组装首页卡片。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. supplyAsync 要指定线程池
2. allOf 只负责等待
3. 每个子任务都要有降级策略

## 一个最小复现场景

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

如果连最小复现都写不出来，其实大概率只是“看懂了别人的总结”，还没有真正掌握。

## 面试里如果被追问

- 先说结论，再补为什么会这样。
- 说一个自己见过或能想象到的翻车场景。
- 最后补上规避办法，而不是停在概念层。

## 这篇学完至少别再犯的错

- 只记 happy path，不补失败分支。
- 看见示例能跑就默认线上也安全。
- 不看日志、不做验证，直接凭感觉改。

## 参考资料

- [java.util.concurrent 包文档](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
- [ThreadPoolExecutor API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html)