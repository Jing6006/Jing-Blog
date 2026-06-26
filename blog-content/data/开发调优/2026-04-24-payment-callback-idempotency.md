---
title: 支付回调接口为什么必须幂等
date: 2026-04-16 10:51:00
updated: 2026-04-16 11:30:00
tags:
  - engineering
categories:
  - 后端框架
description: 支付回调天然会重复到达，本文从重复的根源讲到四种幂等落地方式，以及并发下最容易踩的「丢失更新」。
cover: https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80
abbrlink: payment-callback-idempotency
---

支付回调是后端少数「对方一定会重复调你」的接口。把它做成幂等不是加分项，是底线——一旦同一笔支付被当成两笔处理，轻则重复发货，重则重复加余额、重复返佣，直接是资金事故。

## 回调为什么一定会重复

很多人第一反应是「支付平台为什么不调一次就好」，但重复几乎无法避免：

- **平台重试机制**：微信、支付宝的回调约定是——只要没收到你返回的成功标识（如微信的 `SUCCESS`），就会在几秒到几小时内按退避策略反复推送。你这边超时、抖动、发布重启，都会触发重试。
- **网络层重发**：你已经处理成功并写完库，但响应在回程丢了，对方收不到 ack，继续重推。
- **你自己的架构放大**：回调进来后如果走了 MQ，消息中间件默认是 at-least-once，消费端同样会收到重复。

结论：**重复到达是常态，不是异常**。接口必须假设「同一笔回调会被投递 N 次」，并保证业务结果只生效一次。

## 幂等的本质：找到「同一笔」的唯一标识

所有幂等方案的第一步都是同一件事——确定**幂等键**。支付场景里天然有现成的：

- 商户订单号 `out_trade_no`（你自己生成的，最可靠）
- 支付平台流水号 `transaction_id`

幂等键的要求是：**同一笔业务永远相同，不同业务永远不同**。订单号满足这点，所以一般用它做去重主键。

## 四种落地方式

### 1. 唯一约束 + 流水表（最推荐）

建一张支付流水表，把幂等键做成唯一索引，让数据库帮你挡重复：

```sql
CREATE TABLE pay_callback_log (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    out_trade_no VARCHAR(64) NOT NULL,
    transaction_id VARCHAR(64),
    status      TINYINT     NOT NULL,
    created_at  DATETIME    NOT NULL,
    UNIQUE KEY uk_out_trade_no (out_trade_no)   -- 关键：唯一约束
);
```

```java
@Transactional(rollbackFor = Exception.class)
public void handleCallback(PayNotify notify) {
    try {
        // 唯一约束保证：同一笔只能插入成功一次
        callbackLogMapper.insert(notify.getOutTradeNo(), notify.getTransactionId());
    } catch (DuplicateKeyException e) {
        // 已经处理过，直接当成功返回，不再重复执行业务
        log.info("回调重复，已忽略: {}", notify.getOutTradeNo());
        return;
    }
    // 走到这里说明是「第一次」，安全地执行真正的业务
    orderService.markPaid(notify.getOutTradeNo(), notify.getTransactionId());
}
```

好处是把并发去重交给数据库的唯一索引，不用自己加锁。**插入流水和更新订单必须在同一个事务里**，否则插入成功但更新失败，重试时会被唯一约束挡住、订单却永远变不成已支付。

### 2. 更新订单时校验状态（状态机）

即使有了流水表，更新订单这步也要带状态条件，形成第二道防线：

```sql
UPDATE orders
SET status = 'PAID', pay_time = NOW()
WHERE order_no = #{orderNo}
  AND status = 'WAIT_PAY';   -- 只有「待支付」才允许变更
```

返回的影响行数为 0，说明订单已经不是待支付状态（可能已被处理），直接跳过后续动作。这一步把「幂等」收敛到一条 SQL 里，靠的是 **CAS（比较再更新）** 的思路，天然防并发。

### 3. 分布式锁（兜底，不能单独用）

```java
String key = "pay:lock:" + notify.getOutTradeNo();
if (!redis.setIfAbsent(key, "1", Duration.ofSeconds(10))) {
    return; // 同一笔正在处理，直接放弃
}
try {
    doHandle(notify);
} finally {
    redis.delete(key);
}
```

锁只能保证「同一时刻只有一个线程在处理」，**不能保证「只处理一次」**——锁释放后重试又进来了。所以分布式锁必须和方式 1 或 2 配合，自己绝不能当唯一手段。

### 4. 去重表 + 唯一键（和方式 1 同理，适合非支付的通用幂等）

通用接口可以抽象成一张 `idempotent_record(idempotent_key UNIQUE, ...)`，请求进来先抢插入，插入成功才执行。本质和支付流水表一样。

## 最容易翻车的点：并发下的丢失更新

真正出事故的场景，往往是**两条重复回调几乎同时到达**：

1. 线程 A、B 同时查订单，都看到 `status = WAIT_PAY`；
2. 两个线程都觉得「我是第一次」，都去执行加余额；
3. 余额被加了两次。

先查后改的代码（`if (查到待支付) { 加余额 }`）在并发下必然漏。靠谱的做法只有两个：

- **用方式 1 的唯一约束**：第二条插入直接抛 `DuplicateKeyException`，根本进不到业务；
- **用方式 2 的带条件 UPDATE**：靠数据库行锁 + 状态条件，第二条 `UPDATE` 影响行数为 0。

二者都把判断和写入压成一个原子操作，这才是幂等的关键——**不要在应用层「先判断再操作」，要让存储层一步到位**。

## 一份能落地的检查清单

- [ ] 幂等键选的是业务唯一标识（订单号），不是时间戳或自增 ID
- [ ] 流水表唯一约束 + 订单状态条件，两道防线都在
- [ ] 插入流水和更新业务在**同一事务**
- [ ] 回调验签通过后再处理，金额和订单号都要校验
- [ ] 处理完成后才返回平台要求的成功标识，否则宁可让它重试
- [ ] 回调日志保留原始报文，便于对账和排查

## 小结

支付回调幂等的核心不是「记得加个判断」，而是想清楚两件事：用什么做幂等键、把判断和写入压成一个原子操作。把唯一约束和状态机这两道防线落到数据库层，应用层的并发问题大半就消失了。

## 参考资料

- [微信支付 - 支付结果通知](https://pay.weixin.qq.com/doc/v3/merchant/4012791861)
- [支付宝 - 异步通知说明](https://opendocs.alipay.com/open/270/105902)
