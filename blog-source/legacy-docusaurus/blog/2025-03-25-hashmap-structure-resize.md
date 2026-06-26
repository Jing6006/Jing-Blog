---
slug: hashmap-structure-resize
title: HashMap 的底层结构和扩容过程
authors: [jing]
tags: [java]
date: 2025-03-24
---

今天不想写长文，先把 **HashMap 的底层结构和扩容过程** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

从数组、链表、红黑树和负载因子理解 HashMap。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- hash 决定桶位置。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 扩容会重新分布节点。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 可变对象不适合作为 key。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 并发写入不能依赖 HashMap。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：手写几个 hash 冲突的 key，观察 put 和 get 的行为。

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