---
slug: service-timeout-fallback
title: 服务超时之后如何做兜底
authors: [jing]
tags: [spring, engineering]
date: 2026-01-21
---

这篇按踩坑笔记来写，因为 **服务超时之后如何做兜底** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

兜底要明确返回的是降级结果，而不是假装成功。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：给用户画像接口加缓存兜底。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 读接口可返回缓存
2. 写接口要谨慎降级
3. 超时参数要小于调用方等待时间

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