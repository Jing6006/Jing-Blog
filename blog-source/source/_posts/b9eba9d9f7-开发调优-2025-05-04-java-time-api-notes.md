---
title: Java 时间 API：LocalDateTime 使用笔记
date: 2025-04-30 20:26:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - Java 基础
description: 区分日期、时间、时区和时间戳。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: java-time-api-notes
synced_from_content_repo: true
source_path: 开发调优/2025-05-04-java-time-api-notes.md
---

今天不想写长文，先把 **Java 时间 API：LocalDateTime 使用笔记** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

区分日期、时间、时区和时间戳。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- LocalDateTime 不包含时区。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 跨系统传输优先明确时区。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 数据库字段要统一约定。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：把订单创建时间转成接口返回字符串，明确格式和时区。

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

- [Java 官方文档](https://docs.oracle.com/en/java/)
- [Java 语言规范](https://docs.oracle.com/javase/specs/)
