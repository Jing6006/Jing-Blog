---
slug: trace-id-log
title: 日志链路 ID 帮我少走了多少弯路
authors: [jing]
tags: [engineering]
date: 2026-01-21
---

这篇我想按“排查记录”来写，主题是 **日志链路 ID 帮我少走了多少弯路**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

链路 ID 让一次请求在多层日志中能被串起来。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 入口生成 traceId
- 跨服务透传 header
- 异步任务要手动带上下文

## 带入一个排查场景

用过滤器和 MDC 给接口日志加 traceId。

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

- [Maven Documentation](https://maven.apache.org/guides/)
- [Git Documentation](https://git-scm.com/doc)