---
slug: mockito-pitfalls
title: Mockito 写测试时我踩过的坑
authors: [jing]
tags: [engineering]
date: 2026-03-03
---

这篇按踩坑笔记来写，因为 **Mockito 写测试时我踩过的坑** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

Mock 是隔离依赖的工具，不是让测试通过的遮羞布。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：给订单服务 mock 库存服务返回不足。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 不要 mock 被测对象核心逻辑
2. 验证交互要有业务意义
3. stub 要覆盖异常分支

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