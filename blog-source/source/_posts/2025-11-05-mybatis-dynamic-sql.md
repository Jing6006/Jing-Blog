---
title: MyBatis 动态 SQL 写法整理
date: 2025-11-03 09:12:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 动态 SQL 要服务于可读性，不能把条件拼接写散。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: mybatis-dynamic-sql
synced_from_content_repo: true
source_path: 数据库与中间件/2025-11-05-mybatis-dynamic-sql.md
---

这篇按踩坑笔记来写，因为 **MyBatis 动态 SQL 写法整理** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

动态 SQL 要服务于可读性，不能把条件拼接写散。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：写一个订单列表的组合筛选查询。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. if 控制可选条件
2. where 自动处理前缀
3. foreach 处理批量参数
4. 复杂查询要保留 SQL 可解释性

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
