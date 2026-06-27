---
title: Sentinel 限流降级入门实践
date: 2026-01-02 20:26:00
updated: 2026-06-26 07:16:12
tags:
  - spring
  - engineering
  - redis
  - architecture
categories:
  - 开发调优
description: 用规则把流量控制从业务代码中抽离出来。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: sentinel-rate-limit-practice
synced_from_content_repo: true
source_path: 开发调优/2026-01-09-sentinel-rate-limit-practice.md
source_hash: 46bf8030bcabfcfd5ef6d9b18bfc09e412df6d41
---

这篇我想按“排查记录”来写，主题是 **Sentinel 限流降级入门实践**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

用规则把流量控制从业务代码中抽离出来。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 资源名要稳定
- 降级返回要符合业务语义
- 规则变更要可观察

## 带入一个排查场景

给商品查询接口加一个简单限流规则。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/index.html)
