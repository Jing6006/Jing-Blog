---
title: 数据库字段设计的一些小原则
date: 2025-11-08 14:07:00
updated: 2026-06-26 07:16:12
tags:
  - database
categories:
  - 数据库与中间件
description: 字段设计要让约束、含义和演进成本清晰。
cover: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80
abbrlink: database-field-design
synced_from_content_repo: true
source_path: 数据库与中间件/2025-11-15-database-field-design.md
---

今天把 **数据库字段设计的一些小原则** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

字段设计要让约束、含义和演进成本清晰。

## 我这次真正记住的点

- 字段名表达业务含义
- 状态字段要有枚举约束
- 金额和时间类型要统一
- 保留审计字段

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：设计一张优惠券领取记录表。

## 先留一段能跑的东西

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
- [MySQL EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
