---
title: AOP 日志切面学习笔记
date: 2025-04-10 15:12:00
updated: 2026-06-22 14:03:56
tags:
  - Spring
  - AOP
  - 日志
categories:
  - 开发调优
description: 围绕 AOP 日志切面 的笔记，记录 Java 后端项目里的判断步骤和实践取舍。
cover: https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80
abbrlink: spring-aop-notes-016
synced_from_date: true
source_path: 开发调优/spring-aop-notes-016.md
---

这篇记录 AOP 日志切面 的笔记。写它不是为了把概念背得更熟，而是把一次项目里可能遇到的问题拆成可复用的判断步骤。

<!-- more -->

## 背景

AOP 日志切面 在 Java 后端项目里经常会出现在接口性能、代码边界或线上排障中。单独看知识点并不难，难的是把它放到真实业务里时，知道应该先观察什么、再调整什么。

## 处理思路

- 先确认问题发生在入口、业务编排、数据访问还是外部依赖。
- 再把日志、参数、执行时间和返回结果放到同一条链路里看。
- 如果涉及共享资源，优先确认并发边界、超时策略和失败补偿。
- 修改后补一条能复现核心场景的测试或脚本，避免只靠手动验证。

## 示例片段

```java
@Around("@annotation(OperationLog)")
public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
    return joinPoint.proceed();
}
```

## 复盘

这次关注点是把概念拆成能在项目里使用的步骤。以后遇到类似问题，我会先保留现场证据，再决定是改代码、改配置还是补监控。技术笔记最有价值的地方，还是把判断过程留下来。
