---
title: Spring Security 过滤器链初步理解
date: 2025-09-17 11:38:00
updated: 2026-06-26 07:16:12
tags:
  - spring
  - security
  - ai
categories:
  - 开发调优
description: 理解请求进入业务接口前经过哪些安全过滤器。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: spring-security-filter-chain
synced_from_content_repo: true
source_path: 开发调优/2025-09-21-spring-security-filter-chain.md
source_hash: e89b52db8c234de051217e4a00783c4745df6775
---

今天不想写长文，先把 **Spring Security 过滤器链初步理解** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

理解请求进入业务接口前经过哪些安全过滤器。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- 认证过滤器提取凭据。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 上下文保存身份信息。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 授权阶段判断访问权限。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：给一个接口配置登录可访问和管理员可访问两种规则。

这样回答有个好处，不会显得像在背书，因为每一句都能落到接口、表结构、线程、缓存或者日志上。

## 一个最小例子

```java
if (!tokenService.valid(token)) {
    throw new UnauthorizedException("登录已过期");
}
SecurityContext.setCurrentUser(tokenService.parseUser(token));
```

这个例子不求大而全，只求能把核心点钉住。写完后我一般会补一个反例，看看自己是不是只会顺着讲。

## 我会继续追问自己什么

- 这道题最容易和哪个概念混在一起。
- 如果业务量上来，它会不会变成性能问题。
- 如果线上出故障，我第一步会看日志、线程、SQL 还是缓存。

## 参考资料

- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [JWT RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
