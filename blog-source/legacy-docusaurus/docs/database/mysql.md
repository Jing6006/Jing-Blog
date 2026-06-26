---
title: MySQL
---

MySQL 专栏用来记录索引、事务、锁、SQL 优化和数据建模。

## 计划选题

- 索引设计和执行计划阅读。
- 事务隔离级别和锁等待问题。
- 慢 SQL 排查流程。
- 分页、统计、批量写入的优化思路。

## 常用排查入口

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 10001;
SHOW PROCESSLIST;
```

实际排查时需要结合表结构、数据量、索引和业务查询频率。
