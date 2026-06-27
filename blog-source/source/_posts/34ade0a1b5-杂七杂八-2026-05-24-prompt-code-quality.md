---
title: Prompt 写得清楚，代码质量才有上限
date: 2026-05-22 09:12:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
  - ai
categories:
  - 杂七杂八
description: 提示词不是玄学，本质是把需求、约束和验收标准说清楚。
cover: https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80
abbrlink: prompt-code-quality
synced_from_content_repo: true
source_path: 杂七杂八/2026-05-24-prompt-code-quality.md
source_hash: 9f73c0f58dd867d859e0cfce1de8c72a2f3719fd
---

这篇按踩坑笔记来写，因为 **Prompt 写得清楚，代码质量才有上限** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

提示词不是玄学，本质是把需求、约束和验收标准说清楚。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：给一个接口重构任务写更完整的提示。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 说明技术栈和现有代码
2. 写清楚不要改什么
3. 要求给出测试和边界

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
