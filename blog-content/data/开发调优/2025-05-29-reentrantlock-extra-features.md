---
title: ReentrantLock 比 synchronized 多了什么
date: 2025-05-26 19:33:00
updated: 2025-05-26 19:57:00
tags:
  - java
categories:
  - Java 基础
description: 理解可中断、可超时、公平锁和条件队列。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: reentrantlock-extra-features
---

这篇按踩坑笔记来写，因为 **ReentrantLock 比 synchronized 多了什么** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

理解可中断、可超时、公平锁和条件队列。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：用 tryLock 给库存扣减加一个快速失败分支。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 必须在 finally 里 unlock
2. tryLock 适合失败可降级场景
3. Condition 能拆分等待队列

## 一个最小复现场景

```java
String key = "order:" + orderId;
Order cached = redisTemplate.opsForValue().get(key);
if (cached != null) {
    return cached;
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