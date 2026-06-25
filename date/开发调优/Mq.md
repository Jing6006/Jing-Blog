---
title: 消息队列核心问题与解决方案
date: 2024-11-20 09:30:00
categories:
  - 开发调优
tags:
  - 消息队列
  - RocketMQ
  - 分布式系统
description: 深入分析消息队列使用中的常见问题，包括消息丢失、重复消费、消息积压、顺序性等，提供完整的解决方案。
---

## 消息队列的核心作用

消息队列（Message Queue）是分布式系统中的重要组件，主要作用包括：

- **异步解耦**：服务之间通过消息通信，降低耦合度
- **流量削峰**：缓冲突发流量，保护下游系统
- **异步提速**：耗时操作异步处理，提升用户体验
- **最终一致性**：实现分布式事务的最终一致性

### 主流 MQ 对比

| 特性 | RocketMQ | RabbitMQ | Kafka |
|------|----------|----------|-------|
| 吞吐量 | 10万/秒 | 1万/秒 | 100万/秒 |
| 事务消息 | ✓ 完善 | ✓ 基础 | ✗ 不支持 |
| 消息可靠性 | 极高 | 高 | 高 |
| 顺序消息 | ✓ 支持 | ✓ 支持 | ✓ 支持 |
| 延时消息 | ✓ 支持 | ✓ 插件支持 | ✗ 不支持 |
| 适用场景 | 金融业务 | 通用业务 | 日志采集 |

---

## 问题一：如何保证消息不丢失

消息丢失可能发生在三个环节，需要分别保障：

### 1. 生产者防丢失

**问题**：消息发送失败或网络异常导致消息未到达 Broker

**解决方案**：

```java
// 开启发送确认机制
DefaultMQProducer producer = new DefaultMQProducer("producer_group");
producer.setRetryTimesWhenSendFailed(3);  // 发送失败重试3次

// 同步发送（等待确认）
SendResult result = producer.send(message);
if (result.getSendStatus() != SendStatus.SEND_OK) {
    // 处理发送失败
    log.error("消息发送失败: {}", result);
}

// 或使用异步发送带回调
producer.send(message, new SendCallback() {
    @Override
    public void onSuccess(SendResult sendResult) {
        log.info("消息发送成功: {}", sendResult.getMsgId());
    }
    
    @Override
    public void onException(Throwable e) {
        log.error("消息发送失败", e);
        // 记录失败消息，后续补偿
    }
});
```

### 2. Broker 防丢失

**问题**：Broker 宕机导致内存中的消息丢失

**解决方案**：

```properties
# 开启消息持久化
storePathRootDir=/data/rocketmq/store
flushDiskType=SYNC_FLUSH  # 同步刷盘（可靠性高但性能低）
# flushDiskType=ASYNC_FLUSH  # 异步刷盘（性能高但有丢失风险）

# 集群部署主从同步
brokerRole=SYNC_MASTER  # 同步复制到从节点
```

**刷盘策略选择**：
- **同步刷盘**：消息写入磁盘后才返回，适合资金类核心业务
- **异步刷盘**：消息写入内存即返回，后台异步落盘，适合普通业务

### 3. 消费者防丢失

**问题**：消费者处理消息时宕机，消息未完成处理

**解决方案**：

```java
@RocketMQMessageListener(
    topic = "order-topic",
    consumerGroup = "order-consumer",
    messageModel = MessageModel.CLUSTERING
)
public class OrderConsumer implements RocketMQListener<Order> {
    
    @Override
    public void onMessage(Order order) {
        try {
            // 处理业务逻辑
            orderService.processOrder(order);
            
            // 手动ACK：处理成功后自动确认
            // RocketMQ 的 Spring Boot Starter 会自动处理 ACK
            
        } catch (Exception e) {
            // 抛出异常，消息会重新入队
            throw new RuntimeException("订单处理失败", e);
        }
    }
}
```

**关键点**：
- 关闭自动 ACK，改为手动 ACK
- 业务处理成功后再确认消息
- 处理失败抛出异常，消息自动重新投递

---

## 问题二：如何避免重复消费

### 重复消费产生原因

1. 消费者处理完消息，发送 ACK 时网络超时，Broker 未收到确认，消息重新投递
2. 生产者重试发送导致消息重复
3. 集群节点切换、死信重试等场景

**结论**：MQ 本身无法完全避免重复消息，需要消费端做幂等处理

### 解决方案

#### 方案一：数据库唯一索引

```sql
CREATE TABLE `order` (
  `id` BIGINT PRIMARY KEY,
  `msg_id` VARCHAR(64) NOT NULL UNIQUE KEY,  -- 消息ID唯一索引
  `order_no` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(10,2)
) ENGINE=InnoDB;
```

#### 方案二：Redis 判重

```java
@Override
public void onMessage(Order order) {
    String msgId = order.getMsgId();
    String key = "msg:consumed:" + msgId;
    
    // 检查是否已处理
    Boolean exists = redisTemplate.opsForValue()
        .setIfAbsent(key, "1", 24, TimeUnit.HOURS);
    
    if (!exists) {
        log.info("消息已处理，跳过: {}", msgId);
        return;
    }
    
    // 处理业务
    orderService.createOrder(order);
}
```

#### 方案三：状态机控制

```java
@Override
public void onMessage(PaymentNotification notification) {
    String orderNo = notification.getOrderNo();
    
    // 查询订单状态
    Order order = orderMapper.selectByOrderNo(orderNo);
    
    if (order.getStatus() == OrderStatus.PAID) {
        // 已支付，直接返回
        log.info("订单已支付，跳过重复消息: {}", orderNo);
        return;
    }
    
    // 执行支付逻辑
    paymentService.processPayment(order);
}
```

---

## 问题三：消息积压如何处理

### 积压产生原因

- 消费速度 < 生产速度
- 消费逻辑耗时过长（慢SQL、同步IO、第三方调用）
- 消费者异常频繁重试

### 排查步骤

1. 查看消费者监控：消费TPS、处理耗时
2. 检查消费者日志：是否有异常或慢查询
3. 查看队列堆积量：确认积压程度

### 解决方案

#### 1. 紧急扩容

```bash
# 增加消费者实例数量
# Docker 环境
docker-compose scale order-consumer=5

# K8s 环境
kubectl scale deployment order-consumer --replicas=5
```

**注意**：消费者数量受队列分区数限制
- 1个分区只能被1个消费者消费
- 消费者数量 > 分区数时，多余的消费者会空闲
- 需要增加Topic分区数才能真正提升并行度

#### 2. 优化消费逻辑

```java
// 优化前：同步调用第三方接口
public void onMessage(Order order) {
    // 慢SQL查询（200ms）
    User user = userService.getUserDetail(order.getUserId());
    
    // 同步调用第三方（500ms）
    boolean result = thirdPartyService.notifyPartner(order);
    
    // 处理订单
    orderService.process(order);
}

// 优化后：异步处理 + 批量查询
public void onMessage(Order order) {
    // 只做核心逻辑
    orderService.process(order);
    
    // 第三方通知改为异步
    asyncNotifyService.notifyPartner(order);
}
```

#### 3. 批量消费

```java
@RocketMQMessageListener(
    topic = "order-topic",
    consumerGroup = "order-consumer",
    consumeMode = ConsumeMode.CONCURRENTLY,
    consumeThreadMax = 20,  // 增加消费线程
    consumeMessageBatchMaxSize = 10  // 批量消费
)
public class OrderBatchConsumer implements RocketMQListener<List<Order>> {
    
    @Override
    public void onMessage(List<Order> orders) {
        // 批量处理
        orderService.batchProcess(orders);
    }
}
```

#### 4. 死信队列隔离

```properties
# 限制最大重试次数
maxReconsumeTimes=3

# 重试失败进入死信队列
# 主题名：%DLQ%消费组名
```

```java
// 监听死信队列
@RocketMQMessageListener(
    topic = "%DLQ%order-consumer",
    consumerGroup = "dlq-handler"
)
public class DeadLetterQueueHandler implements RocketMQListener<Order> {
    
    @Override
    public void onMessage(Order order) {
        // 记录死信消息，人工处理
        log.error("死信消息: {}", order);
        deadLetterService.save(order);
    }
}
```

---

## 问题四：如何保证消息顺序

### 顺序消息类型

1. **全局有序**：所有消息严格有序（单队列、单生产者、单消费者，性能极低）
2. **局部有序**：同一业务的消息有序（推荐方案）

### 实现局部有序

```java
// 发送消息时指定队列选择器
producer.send(message, new MessageQueueSelector() {
    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        // 根据订单号哈希，确保同一订单的消息进入同一队列
        String orderNo = (String) arg;
        int index = Math.abs(orderNo.hashCode()) % mqs.size();
        return mqs.get(index);
    }
}, order.getOrderNo());

// 消费端顺序消费
@RocketMQMessageListener(
    topic = "order-topic",
    consumerGroup = "order-consumer",
    consumeMode = ConsumeMode.ORDERLY  // 顺序消费模式
)
public class OrderConsumer implements RocketMQListener<Order> {
    @Override
    public void onMessage(Order order) {
        // 顺序处理消息
        orderService.processInOrder(order);
    }
}
```

### 乱序容错

即使保证了发送顺序，消费端也可能乱序，可以通过状态校验兜底：

```java
@Override
public void onMessage(OrderEvent event) {
    Order order = orderService.getById(event.getOrderId());
    
    // 状态校验
    if (event.getType() == EventType.STOCK_DEDUCTED && 
        order.getStatus() != OrderStatus.CREATED) {
        // 前置步骤未完成，延时重试
        throw new RetryLaterException("订单状态异常，等待重试");
    }
    
    // 执行业务
    processEvent(event);
}
```

---

## 问题五：分布式事务消息

### 使用场景

跨服务的数据一致性保障，如：
- 订单服务创建订单 + 库存服务扣减库存
- 支付服务扣款 + 账户服务更新余额

### 实现流程

```java
// 1. 发送事务消息
@Service
public class OrderService {
    
    @Autowired
    private RocketMQTemplate rocketMQTemplate;
    
    public void createOrder(Order order) {
        // 发送半消息（消费者暂时收不到）
        TransactionSendResult result = rocketMQTemplate.sendMessageInTransaction(
            "order-topic",
            MessageBuilder.withPayload(order).build(),
            order
        );
    }
}

// 2. 本地事务监听器
@RocketMQTransactionListener
public class OrderTransactionListener implements RocketMQLocalTransactionListener {
    
    @Autowired
    private OrderMapper orderMapper;
    
    // 执行本地事务
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            Order order = (Order) arg;
            // 执行本地数据库事务
            orderMapper.insert(order);
            
            // 提交消息，下游可以消费
            return RocketMQLocalTransactionState.COMMIT;
        } catch (Exception e) {
            log.error("本地事务执行失败", e);
            // 回滚消息
            return RocketMQLocalTransactionState.ROLLBACK;
        }
    }
    
    // 事务回查（服务宕机后，Broker主动回查）
    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message msg) {
        String orderId = msg.getHeaders().get("orderId");
        
        // 查询本地事务执行结果
        boolean exists = orderMapper.existsById(orderId);
        
        return exists ? RocketMQLocalTransactionState.COMMIT 
                      : RocketMQLocalTransactionState.ROLLBACK;
    }
}

// 3. 下游消费
@RocketMQMessageListener(topic = "order-topic", consumerGroup = "inventory-consumer")
public class InventoryConsumer implements RocketMQListener<Order> {
    
    @Override
    public void onMessage(Order order) {
        // 扣减库存（注意幂等处理）
        inventoryService.deduct(order.getProductId(), order.getQuantity());
    }
}
```

---

## 综合实践案例

### 场景：支付回调消息处理

需求：
- 接收支付平台的回调消息
- 更新订单状态、扣减余额、生成流水
- 保证不重复扣款、不丢失消息、数据一致

### 完整方案

```java
@RocketMQMessageListener(
    topic = "payment-callback",
    consumerGroup = "payment-consumer"
)
public class PaymentCallbackConsumer implements RocketMQListener<PaymentNotification> {
    
    @Autowired
    private OrderService orderService;
    
    @Override
    public void onMessage(PaymentNotification notification) {
        String orderNo = notification.getOrderNo();
        String msgId = notification.getMsgId();
        
        // 1. 幂等判重（Redis）
        String lockKey = "payment:lock:" + orderNo;
        Boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, msgId, 30, TimeUnit.SECONDS);
        
        if (!locked) {
            log.info("支付回调重复消息，跳过: {}", orderNo);
            return;
        }
        
        try {
            // 2. 查询订单状态（二次防重）
            Order order = orderService.getByOrderNo(orderNo);
            if (order.getStatus() == OrderStatus.PAID) {
                log.info("订单已支付，跳过: {}", orderNo);
                return;
            }
            
            // 3. 本地事务处理（一致性保障）
            orderService.processPayment(order, notification);
            
        } catch (Exception e) {
            // 4. 异常重试
            log.error("支付回调处理失败: {}", orderNo, e);
            throw new RuntimeException("处理失败，触发重试", e);
        } finally {
            // 释放锁
            redisTemplate.delete(lockKey);
        }
    }
}

@Service
public class OrderService {
    
    @Transactional(rollbackFor = Exception.class)
    public void processPayment(Order order, PaymentNotification notification) {
        // 扣减账户余额
        accountService.deduct(order.getUserId(), order.getAmount());
        
        // 更新订单状态
        order.setStatus(OrderStatus.PAID);
        order.setPaidTime(new Date());
        orderMapper.updateById(order);
        
        // 生成支付流水（唯一索引防重）
        PaymentRecord record = new PaymentRecord();
        record.setOrderNo(order.getOrderNo());
        record.setMsgId(notification.getMsgId());  // 唯一索引
        record.setAmount(notification.getAmount());
        paymentRecordMapper.insert(record);
    }
}
```

---

## 监控与运维

### 关键监控指标

1. **消息堆积量**：Topic级别的未消费消息数
2. **消费TPS**：每秒消费消息数量
3. **消费耗时**：平均处理时长
4. **死信队列堆积**：异常消息数量

### 告警配置

```yaml
# 示例：Prometheus + Alertmanager
- alert: MessageBacklog
  expr: rocketmq_consumer_offset_diff > 10000
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "消息积压告警: {{ $labels.topic }}"
    
- alert: ConsumerDown
  expr: up{job="rocketmq-consumer"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "消费者下线: {{ $labels.instance }}"
```

---

## 总结

消息队列的核心问题及解决方案：

| 问题 | 解决方案 | 关键点 |
|------|---------|--------|
| 消息丢失 | 发送确认 + 持久化 + 手动ACK | 三个环节都要保障 |
| 重复消费 | 幂等设计（唯一索引/Redis/状态机） | MQ无法避免，业务层保证 |
| 消息积压 | 扩容 + 优化 + 批量消费 | 注意分区数限制 |
| 顺序性 | 局部有序 + 状态校验 | 同一业务路由到同一队列 |
| 分布式事务 | 事务消息 + 本地事务 + 回查 | 最终一致性 |

在实际项目中，需要结合业务特点，综合运用多种方案，并配合完善的监控告警机制，才能保证消息队列系统的稳定可靠运行。
