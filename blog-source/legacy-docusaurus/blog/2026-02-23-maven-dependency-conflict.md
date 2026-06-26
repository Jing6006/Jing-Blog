---
slug: maven-dependency-conflict
title: Maven 依赖冲突的一次排查
authors: [jing]
tags: [engineering]
date: 2026-02-18
---

今天把 **Maven 依赖冲突的一次排查** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

依赖冲突要看最终生效版本，而不是只看 pom。

## 我这次真正记住的点

- dependency:tree 找来源
- 就近原则影响版本选择
- dependencyManagement 统一版本

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：排查一个 Jackson 版本不一致导致的启动问题。

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

- [Maven Documentation](https://maven.apache.org/guides/)
- [Git Documentation](https://git-scm.com/doc)