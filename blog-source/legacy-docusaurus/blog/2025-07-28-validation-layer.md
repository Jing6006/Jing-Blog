---
slug: validation-layer
title: 参数校验应该放在哪一层
authors: [jing]
tags: [spring]
date: 2025-07-28
---

这篇按踩坑笔记来写，因为 **参数校验应该放在哪一层** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

格式校验靠入口，业务规则靠领域或服务层。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：实现新增商品接口的入参校验和库存规则校验。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 空值和长度用 Bean Validation
2. 跨字段规则写成业务校验
3. 错误提示要能指导修正

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

- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/index.html)