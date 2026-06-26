---
slug: enum-business-status
title: 枚举类在业务状态流转里的用法
authors: [jing]
tags: [java]
date: 2025-05-13
---

这篇我想按“排查记录”来写，主题是 **枚举类在业务状态流转里的用法**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

把状态码、描述和允许的流转放到同一个语义里。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 枚举能减少魔法字符串
- 状态流转要校验前置状态
- 数据库保存 code 而不是 ordinal

## 带入一个排查场景

实现订单从待支付到已取消、已支付的状态校验。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [Java 官方文档](https://docs.oracle.com/en/java/)
- [Java 语言规范](https://docs.oracle.com/javase/specs/)