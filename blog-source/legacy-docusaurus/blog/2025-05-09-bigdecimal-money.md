---
slug: bigdecimal-money
title: BigDecimal 金额计算为什么容易出错
authors: [jing]
tags: [java]
date: 2025-05-08
---

这篇按踩坑笔记来写，因为 **BigDecimal 金额计算为什么容易出错** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

金额计算要控制精度、舍入和构造方式。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：实现订单总价、优惠和实付金额计算。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 避免用 double 构造 BigDecimal
2. 除法必须考虑舍入模式
3. 金额单位可以用分降低复杂度

## 一个最小复现场景

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
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

- [Java 官方文档](https://docs.oracle.com/en/java/)
- [Java 语言规范](https://docs.oracle.com/javase/specs/)