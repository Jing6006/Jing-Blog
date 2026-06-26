---
title: 消息重试、死信队列和人工补偿
date: 2025-12-20 09:12:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
categories:
  - 数据库与中间件
description: 失败处理要分清临时失败和永久失败。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: message-retry-dlq
synced_from_content_repo: true
source_path: 开发调优/2025-12-25-message-retry-dlq.md
---

今天把 **消息重试、死信队列和人工补偿** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

失败处理要分清临时失败和永久失败。

## 我这次真正记住的点

- 网络抖动适合重试
- 参数错误不该无限重试
- 死信消息要能告警和回放

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：设计优惠券发放失败后的死信处理流程。

## 先留一段能跑的东西

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [RabbitMQ Documentation](https://www.rabbitmq.com/docs)
- [Apache RocketMQ Documentation](https://rocketmq.apache.org/docs/)
