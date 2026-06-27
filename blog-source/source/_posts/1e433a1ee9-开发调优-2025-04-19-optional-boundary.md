---
title: Optional 适合解决什么问题
date: 2025-04-17 09:12:00
updated: 2026-06-26 07:16:12
tags:
  - java
categories:
  - 开发调优
description: 用 Optional 表达可能不存在的返回值，而不是替代所有 null。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: optional-boundary
synced_from_content_repo: true
source_path: 开发调优/2025-04-19-optional-boundary.md
source_hash: d849aa246404140440a762a713def26da35489c8
---

这篇按踩坑笔记来写，因为 **Optional 适合解决什么问题** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

用 Optional 表达可能不存在的返回值，而不是替代所有 null。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：重构一个查询用户昵称的方法，让调用方显式处理缺失。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 返回值可以用 Optional
2. 字段和入参不建议滥用
3. orElseGet 避免提前执行

## 一个最小复现场景

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
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

- [Java 官方文档](https://docs.oracle.com/en/java/)
- [Java 语言规范](https://docs.oracle.com/javase/specs/)
