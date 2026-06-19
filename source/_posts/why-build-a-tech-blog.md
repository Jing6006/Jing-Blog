---
title: 为什么要搭一个自己的技术博客
tags:
  - Hexo
  - 博客搭建
  - 工程实践
categories:
  - 工程实践
description: 用 Hexo 和 Butterfly 搭建一个适合软件开发工程师长期维护的技术博客。
cover: >-
  https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80
abbrlink: cb95d44e
date: 2026-06-19 23:30:00
updated: 2026-06-19 23:30:00
---

我准备把这个博客当成一个长期维护的技术资产，而不是只存放零散笔记的地方。

## 写什么

第一阶段会优先整理这些内容：

- Java 后端开发中的常见问题。
- Spring Boot 项目实践。
- MySQL、Redis 和中间件排查。
- 项目复盘、部署流程和工程效率。

## 怎么写

每篇文章尽量保持一个清楚的问题：

- 遇到了什么现象。
- 当时怎么定位。
- 最后怎么解决。
- 以后怎么避免。

技术文章最有价值的地方，不只是结论，而是从现象到判断的过程。

```java
public class Blog {
    public static void main(String[] args) {
        System.out.println("Keep writing, keep shipping.");
    }
}
```

## 当前技术栈

这套博客采用 `Hexo + Butterfly`，文章使用 Markdown 编写，构建后由 Nginx 托管到自己的服务器。
