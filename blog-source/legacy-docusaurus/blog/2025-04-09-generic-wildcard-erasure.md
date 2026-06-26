---
slug: generic-wildcard-erasure
title: 泛型、通配符和类型擦除整理
authors: [jing]
tags: [java]
date: 2025-04-03
---

今天把 **泛型、通配符和类型擦除整理** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

把泛型看成编译期类型约束，而不是运行期魔法。

## 我这次真正记住的点

- extends 适合读取
- super 适合写入
- 类型擦除解释了很多运行期限制

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：给一个集合复制方法分别使用 extends 和 super。

## 先留一段能跑的东西

```java
public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [Java 官方文档](https://docs.oracle.com/en/java/)
- [Java 语言规范](https://docs.oracle.com/javase/specs/)