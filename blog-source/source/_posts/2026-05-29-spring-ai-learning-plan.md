---
title: Spring AI 是什么，我准备怎么学
date: 2026-05-22 11:38:00
updated: 2026-06-26 07:16:12
tags:
  - spring
  - engineering
categories:
  - 后端框架
description: 先理解 Spring AI 的抽象，再考虑接入具体模型。
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80
abbrlink: spring-ai-learning-plan
synced_from_content_repo: true
source_path: 后端框架/2026-05-29-spring-ai-learning-plan.md
---

今天不想写长文，先把 **Spring AI 是什么，我准备怎么学** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

先理解 Spring AI 的抽象，再考虑接入具体模型。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- ChatClient 负责对话调用。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- EmbeddingModel 负责向量化。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- VectorStore 负责检索存储。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：用最小 Demo 调一次模型接口并打印响应。

这样回答有个好处，不会显得像在背书，因为每一句都能落到接口、表结构、线程、缓存或者日志上。

## 一个最小例子

```java
List<Document> chunks = splitter.split(document);
vectorStore.add(chunks);
List<Document> matched = vectorStore.similaritySearch(question);
```

这个例子不求大而全，只求能把核心点钉住。写完后我一般会补一个反例，看看自己是不是只会顺着讲。

## 我会继续追问自己什么

- 这道题最容易和哪个概念混在一起。
- 如果业务量上来，它会不会变成性能问题。
- 如果线上出故障，我第一步会看日志、线程、SQL 还是缓存。

## 参考资料

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- [Redis Vector Search](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)
