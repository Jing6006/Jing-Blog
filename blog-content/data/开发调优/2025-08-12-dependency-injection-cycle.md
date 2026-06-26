---
title: 依赖注入和循环依赖问题复盘
date: 2025-08-12 20:26:00
updated: 2025-08-12 21:05:00
tags:
  - spring
categories:
  - 后端框架
description: 循环依赖通常暴露了职责边界不清。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: dependency-injection-cycle
---

今天不想写长文，先把 **依赖注入和循环依赖问题复盘** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

循环依赖通常暴露了职责边界不清。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- 构造器注入更容易暴露问题。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 懒加载只是缓解不是设计。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 拆分服务职责优先。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：把互相调用的 UserService 和 OrderService 拆出协调服务。

这样回答有个好处，不会显得像在背书，因为每一句都能落到接口、表结构、线程、缓存或者日志上。

## 一个最小例子

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

这个例子不求大而全，只求能把核心点钉住。写完后我一般会补一个反例，看看自己是不是只会顺着讲。

## 我会继续追问自己什么

- 这道题最容易和哪个概念混在一起。
- 如果业务量上来，它会不会变成性能问题。
- 如果线上出故障，我第一步会看日志、线程、SQL 还是缓存。

## 参考资料

- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/index.html)