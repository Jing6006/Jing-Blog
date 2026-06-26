---
title: 事务传播行为的几个常见场景
date: 2025-08-25 21:44:00
updated: 2025-08-25 22:09:00
tags:
  - spring
categories:
  - 后端框架
description: 传播行为决定多个事务方法嵌套时如何参与或新建事务。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: transaction-propagation-scenes
---

今天把 **事务传播行为的几个常见场景** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

传播行为决定多个事务方法嵌套时如何参与或新建事务。

## 我这次真正记住的点

- REQUIRED 是默认选择
- REQUIRES_NEW 适合独立流水
- NESTED 依赖保存点能力

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：订单创建失败时保留操作日志。

## 先留一段能跑的东西

```java
@Transactional
public void pay(Long orderId) {
    Order order = orderRepository.getById(orderId);
    order.markPaid();
    orderRepository.save(order);
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/index.html)