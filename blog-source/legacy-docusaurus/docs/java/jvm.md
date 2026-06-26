---
title: JVM
---

JVM 专栏用来记录运行时、内存、垃圾回收和线上排查相关内容。

## 计划选题

- 内存区域和对象生命周期。
- 常见垃圾回收器的适用场景。
- 线程 dump 和堆 dump 的排查流程。
- CPU 飙高、频繁 Full GC、内存泄漏的复盘模板。

## 排查模板

```bash
jps -l
jstack <pid> > thread-dump.txt
jmap -dump:format=b,file=heap.hprof <pid>
```

这类命令依赖具体 JDK 发行版和服务器环境，正式文章里需要结合实际案例补充上下文。
