---
title: 并发编程
---

并发编程专栏记录线程模型、锁、线程池、异步任务和高并发场景下的常见问题。

## 计划选题

- `synchronized` 和 `Lock` 的使用边界。
- 线程池参数怎么根据业务压测结果调整。
- `CompletableFuture` 在接口聚合中的使用。
- 并发场景下的数据一致性问题。

## 代码片段

```java
ExecutorService executor = Executors.newFixedThreadPool(8);

try {
    executor.submit(() -> {
        // business task
    });
} finally {
    executor.shutdown();
}
```
