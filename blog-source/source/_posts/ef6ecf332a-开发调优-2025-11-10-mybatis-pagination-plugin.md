---
title: MyBatis 分页插件和 SQL 可控性
date: 2025-11-03 11:38:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 开发调优
description: 分页插件减少重复代码，但要理解最终执行的 SQL。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: mybatis-pagination-plugin
synced_from_content_repo: true
source_path: 开发调优/2025-11-10-mybatis-pagination-plugin.md
source_hash: bde61810ea2c62b9b2fdf80ee678573d35b62c0c
---

这篇我想按“排查记录”来写，主题是 **MyBatis 分页插件和 SQL 可控性**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

分页插件减少重复代码，但要理解最终执行的 SQL。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 确认 count SQL 是否合理
- 大表分页要限制条件
- 导出不要复用普通分页接口

## 带入一个排查场景

给后台列表接口加分页和排序白名单。

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
