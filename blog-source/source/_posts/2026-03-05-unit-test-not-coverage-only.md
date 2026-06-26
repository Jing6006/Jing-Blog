---
title: 单元测试不是为了凑覆盖率
date: 2026-03-03 10:51:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
categories:
  - 杂七杂八
description: 测试要锁定行为，帮助重构时发现回归。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: unit-test-not-coverage-only
synced_from_content_repo: true
source_path: 杂七杂八/2026-03-05-unit-test-not-coverage-only.md
---

这篇按踩坑笔记来写，因为 **单元测试不是为了凑覆盖率** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

测试要锁定行为，帮助重构时发现回归。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：给优惠券金额计算写三个边界测试。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 优先测分支和边界
2. 外部依赖用替身
3. 测试名表达场景和期望

## 一个最小复现场景

```java
@Test
void shouldRejectWhenStockNotEnough() {
    when(stockClient.enough(anyLong(), anyInt())).thenReturn(false);
    assertThrows(BusinessException.class, () -> orderService.create(command));
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

- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html)
