---
title: 消息重复消费和幂等处理
date: 2025-12-15 08:57:00
updated: 2025-12-15 09:28:00
tags:
  - engineering
categories:
  - 数据库与中间件
description: 消费者必须假设消息可能重复到达。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: message-duplicate-idempotent
---

这篇按踩坑笔记来写，因为 **消息重复消费和幂等处理** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

消费者必须假设消息可能重复到达。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：用订单号和消息类型做消费记录表。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 用业务唯一键去重
2. 数据库唯一约束兜底
3. 消费状态要可查询

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

- [RabbitMQ Documentation](https://www.rabbitmq.com/docs)
- [Apache RocketMQ Documentation](https://rocketmq.apache.org/docs/)