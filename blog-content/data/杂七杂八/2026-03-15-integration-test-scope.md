---
title: 集成测试应该测到什么程度
date: 2026-03-11 21:44:00
updated: 2026-03-11 22:15:00
tags:
  - engineering
categories:
  - 杂七杂八
description: 集成测试关注组件协作，不必覆盖所有细节。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: integration-test-scope
---

今天把 **集成测试应该测到什么程度** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

集成测试关注组件协作，不必覆盖所有细节。

## 我这次真正记住的点

- 启动真实 Spring 上下文
- 核心链路走真实配置
- 外部系统用测试容器或替身

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：测试创建订单接口从 Controller 到数据库的完整链路。

## 先留一段能跑的东西

```java
@Test
void shouldRejectWhenStockNotEnough() {
    when(stockClient.enough(anyLong(), anyInt())).thenReturn(false);
    assertThrows(BusinessException.class, () -> orderService.create(command));
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html)