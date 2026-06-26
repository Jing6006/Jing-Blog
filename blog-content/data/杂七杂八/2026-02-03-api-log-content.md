---
title: 接口日志应该记录什么，不该记录什么
date: 2026-01-28 19:33:00
updated: 2026-01-28 19:56:00
tags:
  - engineering
categories:
  - 杂七杂八
description: 日志要服务排查，同时控制隐私和噪声。
cover: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80
abbrlink: api-log-content
---

今天把 **接口日志应该记录什么，不该记录什么** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

日志要服务排查，同时控制隐私和噪声。

## 我这次真正记住的点

- 记录请求路径和关键参数
- 敏感字段脱敏
- 大对象不要全量打印
- 异常日志保留堆栈

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：给登录接口做手机号和密码脱敏。

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