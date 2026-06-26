---
title: explain 执行计划我重点看哪些字段
date: 2025-10-10 16:18:00
updated: 2025-10-10 16:52:00
tags:
  - database
categories:
  - 数据库与中间件
description: 用 explain 判断查询是否走到预期路径。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: explain-fields
---

这篇我想按“排查记录”来写，主题是 **explain 执行计划我重点看哪些字段**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

用 explain 判断查询是否走到预期路径。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- type 反映访问方式
- key 表示实际使用索引
- rows 是优化器估算行数
- Extra 暴露排序和临时表

## 带入一个排查场景

比较加索引前后 explain 输出变化。

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