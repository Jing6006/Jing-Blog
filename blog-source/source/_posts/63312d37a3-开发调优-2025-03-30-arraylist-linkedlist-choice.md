---
title: ArrayList 和 LinkedList 不只是查询快慢
date: 2025-03-28 21:44:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - 开发调优
description: 结合缓存友好性、遍历方式和插入位置选择集合。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: arraylist-linkedlist-choice
synced_from_content_repo: true
source_path: 开发调优/2025-03-30-arraylist-linkedlist-choice.md
source_hash: 55e17cdb667c1e76219a485a4032f524f19e3e51
---

今天不想写长文，先把 **ArrayList 和 LinkedList 不只是查询快慢** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

结合缓存友好性、遍历方式和插入位置选择集合。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- 大多数业务读多写少用 ArrayList。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- LinkedList 随机访问成本高。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 容量预估能减少扩容。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：模拟批量导入数据，比较提前指定容量和默认容量。

这样回答有个好处，不会显得像在背书，因为每一句都能落到接口、表结构、线程、缓存或者日志上。

## 一个最小例子

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

这个例子不求大而全，只求能把核心点钉住。写完后我一般会补一个反例，看看自己是不是只会顺着讲。

## 我会继续追问自己什么

- 这道题最容易和哪个概念混在一起。
- 如果业务量上来，它会不会变成性能问题。
- 如果线上出故障，我第一步会看日志、线程、SQL 还是缓存。

## 参考资料

- [Java Collections Framework](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [HashMap API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
