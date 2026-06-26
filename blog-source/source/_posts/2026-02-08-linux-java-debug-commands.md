---
title: Linux 上排查 Java 服务的常用命令
date: 2026-01-31 08:57:00
updated: 2026-06-26 07:16:12
tags:
  - engineering
categories:
  - 杂七杂八
description: 从进程、端口、日志和资源使用四个角度定位问题。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: linux-java-debug-commands
synced_from_content_repo: true
source_path: 杂七杂八/2026-02-08-linux-java-debug-commands.md
---

这篇按踩坑笔记来写，因为 **Linux 上排查 Java 服务的常用命令** 我现在更容易记住“错在哪”，而不是“定义长什么样”。

## 先记住这句话

从进程、端口、日志和资源使用四个角度定位问题。

很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。

## 这类问题一般怎么出现

我脑子里会先放这个场景：记录一次服务启动失败的排查命令。

一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。

## 这次我想盯住的坑

1. ps 看进程
2. ss 看端口
3. tail 和 grep 看日志
4. jstack 辅助看线程

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
