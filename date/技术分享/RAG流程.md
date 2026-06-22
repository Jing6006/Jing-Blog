---
title: RAG 流程整理
date: 2026-06-16 14:50:00
updated: 2026-06-16 14:50:00
tags:
  - RAG
  - AI应用
  - 知识库
categories:
  - 技术分享
description: 记录从文档抽取、切分、向量化到检索问答的 RAG 流程
cover: https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=1200&q=80
abbrlink: rag-workflow-notes
---

# RAG流程

场景：

构建一个公司内部的知识库的智能问答机器人

- 抽取：
  - 收集准备文档，上传文档，读取本地上传的文档，提取纯文本内容，过滤乱码格式符号和空白行
- 转换
  - 通过分词器将长文本切分为固定大小的文本切片 ，补充切片的格式，名称，时间
- 加载
  - 调用模型将文本切片转为浮点型向量，存入redsi向量索引
- 检索问答
  - 用户提问时，将问题转为向量，在redis中相似度匹配，召回相似文档片段，结合大模型生成答案