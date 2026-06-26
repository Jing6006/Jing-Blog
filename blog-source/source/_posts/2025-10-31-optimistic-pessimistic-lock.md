---
title: 乐观锁和悲观锁的使用边界
date: 2025-10-28 08:57:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 根据冲突概率和用户体验选择锁策略。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: optimistic-pessimistic-lock
synced_from_content_repo: true
source_path: 数据库与中间件/2025-10-31-optimistic-pessimistic-lock.md
---

今天不想写长文，先把 **乐观锁和悲观锁的使用边界** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

根据冲突概率和用户体验选择锁策略。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- 乐观锁适合低冲突。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 悲观锁适合强一致扣减。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 失败后要有重试或提示。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：用 version 字段实现商品库存更新。

这样回答有个好处，不会显得像在背书，因为每一句都能落到接口、表结构、线程、缓存或者日志上。

## 一个最小例子

```java
String key = "order:" + orderId;
Order cached = redisTemplate.opsForValue().get(key);
if (cached != null) {
    return cached;
}
```

这个例子不求大而全，只求能把核心点钉住。写完后我一般会补一个反例，看看自己是不是只会顺着讲。

## 我会继续追问自己什么

- 这道题最容易和哪个概念混在一起。
- 如果业务量上来，它会不会变成性能问题。
- 如果线上出故障，我第一步会看日志、线程、SQL 还是缓存。

## 参考资料

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
