---
title: AI 生成的代码为什么还要认真 Review
date: 2026-06-16 21:44:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
  - testing
  - ai
categories:
  - 杂七杂八
description: AI 能快速产出代码，但不能替我承担设计、边界和上线责任。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: ai-generated-code-review
synced_from_content_repo: true
source_path: 杂七杂八/2026-06-16-ai-generated-code-review.md
source_hash: 0fa45f13692bfa57c4d1e4dc8ee61730cf812d18
---

这篇我想按“排查记录”来写，主题是 **AI 生成的代码为什么还要认真 Review**。这种写法比纯概念文更适合我自己回看。

## 现象先别急着解释

AI 能快速产出代码，但不能替我承担设计、边界和上线责任。

先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。

## 我会先看哪几件事

- 先看需求是否真的满足
- 再看异常和并发边界
- 最后跑测试和静态检查

## 带入一个排查场景

审查一段 AI 生成的 Controller 和 Service。

如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。

## 排查时能落地的片段

```java
List<Document> chunks = splitter.split(document);
vectorStore.add(chunks);
List<Document> matched = vectorStore.similaritySearch(question);
```

我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。

## 写给自己的复盘

- 下次再遇到类似问题，先证据、后判断。
- 能打印的关键日志别省。
- 结论一定要能回到文档、代码或命令结果上。

## 参考资料

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- [Redis Vector Search](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)
