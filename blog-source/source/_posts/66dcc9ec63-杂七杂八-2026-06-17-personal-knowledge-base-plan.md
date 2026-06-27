---
title: 个人技术知识库应该怎么整理
date: 2026-06-23 13:05:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
  - ai
categories:
  - 杂七杂八
description: 知识库不是资料仓库，而是能支持检索、复习和项目决策的材料系统。
cover: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80
abbrlink: personal-knowledge-base-plan
synced_from_content_repo: true
source_path: 杂七杂八/2026-06-17-personal-knowledge-base-plan.md
source_hash: f36a71c923b7bc94c8518aa171fd031ff1b68875
---

今天不想写长文，先把 **个人技术知识库应该怎么整理** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。

## 先说我自己的结论

知识库不是资料仓库，而是能支持检索、复习和项目决策的材料系统。

我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。

## 快问快答

- 原始资料和个人理解分开保存。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 每篇笔记要有来源和适用场景。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。
- 定期清理过时内容。
  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。

## 如果在项目里问到我

我会直接拿这个场景来讲：把博客文章、项目复盘和代码片段整理成可检索目录。

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
