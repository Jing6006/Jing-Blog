---
title: 事务隔离级别和脏读、幻读复盘
date: 2025-10-28 19:33:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 隔离级别是在一致性和并发性能之间取舍。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: transaction-isolation-review
synced_from_content_repo: true
source_path: 开发调优/2025-10-26-transaction-isolation-review.md
---

这篇我想按“排查记录”来写，主题是 **事务隔离级别和脏读、幻读复盘**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

隔离级别是在一致性和并发性能之间取舍。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 读未提交风险最高
- 读已提交避免脏读
- 可重复读关注同一事务内一致视图

## 带入一个排查场景

用两个会话演示同一行数据更新后的读取差异。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```java
@Transactional
public void pay(Long orderId) {
    Order order = orderRepository.getById(orderId);
    order.markPaid();
    orderRepository.save(order);
}
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
