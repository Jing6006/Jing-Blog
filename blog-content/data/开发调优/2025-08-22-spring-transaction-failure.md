---
title: Spring 事务为什么会失效
date: 2025-08-20 16:18:00
updated: 2025-08-20 16:42:00
tags:
  - spring
categories:
  - 后端框架
description: 事务依赖代理、异常类型和数据库能力。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: spring-transaction-failure
---

这篇按踩坑笔记来写，因为 **Spring 事务为什么会失效** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

事务依赖代理、异常类型和数据库能力。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：复现 self-invocation 导致事务不生效。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 同类内部调用可能绕过代理
2. 默认回滚运行时异常
3. 方法必须运行在事务管理器控制下

## 一个最小复现场景

```java
@Transactional
public void pay(Long orderId) {
    Order order = orderRepository.getById(orderId);
    order.markPaid();
    orderRepository.save(order);
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

- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/index.html)