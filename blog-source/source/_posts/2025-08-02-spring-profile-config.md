---
title: Spring 配置文件和多环境管理
date: 2025-07-30 11:38:00
updated: 2026-06-26 07:16:12
tags:
  - spring
categories:
  - 后端框架
description: 把环境差异收敛到配置，把敏感信息交给部署环境。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: spring-profile-config
synced_from_content_repo: true
source_path: 后端框架/2025-08-02-spring-profile-config.md
---

这篇我想按“排查记录”来写，主题是 **Spring 配置文件和多环境管理**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

把环境差异收敛到配置，把敏感信息交给部署环境。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- profile 区分环境
- 默认值要谨慎
- 密码密钥不要写进仓库

## 带入一个排查场景

整理 dev、test、prod 三套数据库配置。

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
