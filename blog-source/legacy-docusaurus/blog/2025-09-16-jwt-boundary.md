---
slug: jwt-boundary
title: JWT 的优点、问题和使用边界
authors: [jing]
tags: [spring]
date: 2025-09-17
---

今天把 **JWT 的优点、问题和使用边界** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。

## 一句话先立住

JWT 适合无状态认证，但撤销和续期要额外设计。

## 我这次真正记住的点

- 不要在 JWT 里放敏感信息
- 过期时间要合理
- 黑名单会引入状态

## 为什么我会专门记这块

因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。

我现在尽量把知识点挂到一个具体场景上：设计 access token 和 refresh token 的刷新流程。

## 先留一段能跑的东西

```java
if (!tokenService.valid(token)) {
    throw new UnauthorizedException("登录已过期");
}
SecurityContext.setCurrentUser(tokenService.parseUser(token));
```

有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。

## 面试回答别太书面

我会先说结论，再说原因。
然后补一个项目里的使用场景。
最后说边界：它不解决什么，或者什么情况下会失效。

## 参考资料

- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [JWT RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)