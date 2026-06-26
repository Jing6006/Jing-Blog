---
title: Spring Boot
---

Spring Boot 专栏用来整理日常项目开发、配置治理、接口设计和问题排查。

## 计划选题

- 项目分层和包结构。
- 配置文件、环境变量和启动参数管理。
- 全局异常处理和统一响应格式。
- 日志、链路追踪和接口耗时排查。

## 项目结构草案

```text
src/main/java
├── application
├── domain
├── infrastructure
└── interfaces
```

这个结构适合逐步引入领域边界；小项目也可以保持更轻量的 controller、service、repository 分层。
