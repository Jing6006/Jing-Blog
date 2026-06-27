---
title: 线上问题复盘：先保留现场再改代码
date: 2026-05-03 13:05:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
  - testing
categories:
  - 杂七杂八
description: 复盘先还原事实，再分析原因，最后落实改进。
cover: https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80
abbrlink: production-incident-review
synced_from_content_repo: true
source_path: 杂七杂八/2026-05-09-production-incident-review.md
source_hash: 28be1a090fa601d4fd9bac301a62daf379fc72f5
---

这篇按踩坑笔记来写，因为 **线上问题复盘：先保留现场再改代码** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

复盘先还原事实，再分析原因，最后落实改进。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：复盘一次接口超时导致的告警。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. 不要急着重启掩盖现场
2. 保存日志和请求样例
3. 区分直接原因和根因

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

- [Maven Documentation](https://maven.apache.org/guides/)
- [Git Documentation](https://git-scm.com/doc)
