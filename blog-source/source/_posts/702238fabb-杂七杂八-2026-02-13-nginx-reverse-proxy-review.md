---
title: Nginx 反向代理配置复盘
date: 2026-02-09 09:12:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
  - testing
  - ops
categories:
  - 杂七杂八
description: 反向代理要关注请求头、路径转发和超时。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: nginx-reverse-proxy-review
synced_from_content_repo: true
source_path: 杂七杂八/2026-02-13-nginx-reverse-proxy-review.md
source_hash: ce51b6b906d5abe07d1c9f4e11784bf866a321e2
---

这篇我想按“排查记录”来写，主题是 **Nginx 反向代理配置复盘**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

反向代理要关注请求头、路径转发和超时。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- proxy_pass 路径要仔细验证
- 保留真实 IP 需要转发头
- 上传接口要配置大小限制

## 带入一个排查场景

把前端域名代理到后端 Spring Boot 服务。

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

- [Maven Documentation](https://maven.apache.org/guides/)
- [Git Documentation](https://git-scm.com/doc)
