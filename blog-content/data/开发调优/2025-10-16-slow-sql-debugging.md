---
title: 一次慢 SQL 的定位过程
date: 2025-10-12 21:44:00
updated: 2025-10-12 22:19:00
tags:
  - database
categories:
  - 数据库与中间件
description: 慢 SQL 排查要从现象、SQL、索引和数据分布逐步缩小。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: slow-sql-debugging
---

这篇按踩坑笔记来写，因为 **一次慢 SQL 的定位过程** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

慢 SQL 排查要从现象、SQL、索引和数据分布逐步缩小。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：把一个按时间范围查询的接口从全表扫改成索引扫描。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 先确认慢在哪里
2. 再看执行计划
3. 最后验证改动效果

## 一个最小复现场景

```sql
EXPLAIN
SELECT id, user_id, status, created_at
FROM orders
WHERE user_id = ? AND status = ?
ORDER BY created_at DESC
LIMIT 20;
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

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)