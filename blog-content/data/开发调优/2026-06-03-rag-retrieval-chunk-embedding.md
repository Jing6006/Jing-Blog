---
title: RAG 的检索、切片和向量化流程
date: 2026-05-28 14:07:00
updated: 2026-05-28 14:37:00
tags:
  - spring
  - database
categories:
  - 后端框架
description: RAG 的关键不是把文档塞进去，而是让问题能找回正确片段。
cover: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80
abbrlink: rag-retrieval-chunk-embedding
---

今天把 **RAG 的检索、切片和向量化流程** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

RAG 的关键不是把文档塞进去，而是让问题能找回正确片段。

## 我这次真正记住的点

- 清洗文档保留结构
- 切片要兼顾语义完整
- 向量检索后还要重排或过滤

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：把一篇项目文档切成片段并保存元数据。

## 先留一段能跑的东西

```java
List<Document> chunks = splitter.split(document);
vectorStore.add(chunks);
List<Document> matched = vectorStore.similaritySearch(question);
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [Spring AI Reference](https://docs.spring.io/spring-ai/reference/)
- [Redis Vector Search](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/)