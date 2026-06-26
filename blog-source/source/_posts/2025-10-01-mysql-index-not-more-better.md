---
title: MySQL 索引为什么不是越多越好
date: 2025-09-28 20:26:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 索引提升查询，也增加写入和维护成本。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: mysql-index-not-more-better
synced_from_content_repo: true
source_path: 数据库与中间件/2025-10-01-mysql-index-not-more-better.md
---

这篇我想按“排查记录”来写，主题是 **MySQL 索引为什么不是越多越好**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

索引提升查询，也增加写入和维护成本。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 索引占用存储
- 写入要维护索引结构
- 低区分度字段不一定适合单独建索引

## 带入一个排查场景

给用户表的手机号、状态和创建时间设计索引。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```sql
EXPLAIN
SELECT id, user_id, status, created_at
FROM orders
WHERE user_id = ? AND status = ?
ORDER BY created_at DESC
LIMIT 20;
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
