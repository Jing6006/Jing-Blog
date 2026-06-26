---
title: 用 AI 辅助排查问题时我怎么提问
date: 2026-06-14 16:18:00
updated: 2026-06-14 16:51:00
tags:
  - engineering
categories:
  - 杂七杂八
description: 排查类提示词要提供现象、环境、日志、已尝试方案和期望输出。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: prompt-debugging-workflow
---

这篇按踩坑笔记来写，因为 **用 AI 辅助排查问题时我怎么提问** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

排查类提示词要提供现象、环境、日志、已尝试方案和期望输出。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：把一次接口 500 的日志整理成可复查的提问材料。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 先给最小现场信息
2. 让 AI 列排查顺序而不是直接改代码
3. 关键命令和结论要自己验证

## 一个最小复现场景

```java
List<Document> chunks = splitter.split(document);
vectorStore.add(chunks);
List<Document> matched = vectorStore.similaritySearch(question);
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

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- [Redis Vector Search](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)