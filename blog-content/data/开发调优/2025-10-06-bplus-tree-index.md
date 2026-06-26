---
title: B+ 树索引到底解决了什么问题
date: 2025-10-06 10:51:00
updated: 2025-10-06 11:24:00
tags:
  - database
categories:
  - 数据库与中间件
description: 理解范围查询、排序和磁盘访问之间的关系。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: bplus-tree-index
---

今天把 **B+ 树索引到底解决了什么问题** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

理解范围查询、排序和磁盘访问之间的关系。

## 我这次真正记住的点

- 多路树降低高度
- 叶子节点有序便于范围扫描
- 联合索引遵循最左前缀

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：分析 where user_id=? order by created_at desc 的索引。

## 先留一段能跑的东西

```sql
EXPLAIN
SELECT id, user_id, status, created_at
FROM orders
WHERE user_id = ? AND status = ?
ORDER BY created_at DESC
LIMIT 20;
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)