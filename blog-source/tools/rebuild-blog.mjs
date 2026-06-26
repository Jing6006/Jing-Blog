import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentRootDir = path.join(root, '..', 'blog-content', 'data');
const analyticsFile = path.join(root, 'admin', 'data', 'analytics.json');

const covers = [
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
];

const refs = {
  java: [
    ['Java 官方文档', 'https://docs.oracle.com/en/java/'],
    ['Java 语言规范', 'https://docs.oracle.com/javase/specs/'],
  ],
  collections: [
    ['Java Collections Framework', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html'],
    ['HashMap API', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html'],
  ],
  concurrency: [
    ['java.util.concurrent 包文档', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html'],
    ['ThreadPoolExecutor API', 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html'],
  ],
  spring: [
    ['Spring Framework Reference', 'https://docs.spring.io/spring-framework/reference/'],
    ['Spring Boot Reference', 'https://docs.spring.io/spring-boot/index.html'],
  ],
  security: [
    ['Spring Security Reference', 'https://docs.spring.io/spring-security/reference/'],
    ['JWT RFC 7519', 'https://www.rfc-editor.org/rfc/rfc7519'],
  ],
  mysql: [
    ['MySQL Reference Manual', 'https://dev.mysql.com/doc/refman/8.4/en/'],
    ['MySQL EXPLAIN Output Format', 'https://dev.mysql.com/doc/refman/8.4/en/explain-output.html'],
  ],
  redis: [
    ['Redis Docs', 'https://redis.io/docs/latest/'],
    ['Redis Commands', 'https://redis.io/docs/latest/commands/'],
  ],
  mq: [
    ['RabbitMQ Documentation', 'https://www.rabbitmq.com/docs'],
    ['Apache RocketMQ Documentation', 'https://rocketmq.apache.org/docs/'],
  ],
  engineering: [
    ['Maven Documentation', 'https://maven.apache.org/guides/'],
    ['Git Documentation', 'https://git-scm.com/doc'],
  ],
  test: [
    ['JUnit 5 User Guide', 'https://junit.org/junit5/docs/current/user-guide/'],
    ['Mockito Documentation', 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html'],
  ],
  ai: [
    ['Spring AI Reference', 'https://docs.spring.io/spring-ai/reference/'],
    ['Redis Vector Search', 'https://redis.io/docs/latest/develop/ai/search-and-query/vectors/'],
  ],
};

const posts = [
  ['2025-03-01', 'why-write-tech-blog', '为什么我要重新认真写技术博客', '工程复盘', ['engineering'], '把博客当成学习闭环，而不是把零散笔记搬到网上。', ['先写清楚问题来源', '记录判断过程', '留下可复查的代码和命令'], '从一次排查记录开始，而不是从宏大的技术路线开始。', 'engineering'],
  ['2025-03-05', 'java-object-reference-value', 'Java 对象、引用和值传递到底怎么理解', 'Java 基础', ['java'], '区分变量里保存的是值还是对象引用，避免把参数传递讲混。', ['基本类型传递的是值副本', '引用变量的副本仍然指向同一个对象', '重新赋值和修改对象字段不是一回事'], '写两个小方法分别修改字段和重新赋值，观察调用方对象是否变化。', 'java'],
  ['2025-03-10', 'jvm-memory-areas', '从一段代码重新认识 JVM 内存区域', 'Java 基础', ['java'], '用方法调用、对象创建和线程执行串起运行时数据区。', ['堆保存对象实例', '虚拟机栈保存方法调用帧', '方法区保存类元信息', '程序计数器服务于线程切换'], '把一次 Controller 调用画成对象、栈帧和线程的关系图。', 'java'],
  ['2025-03-15', 'read-gc-log-first-time', '第一次认真看 GC 日志：我关注了哪些字段', 'Java 基础', ['java'], '把 GC 日志当作现象记录，而不是一串看不懂的参数。', ['先看收集器和堆大小', '再看暂停时间和回收前后容量', '最后结合接口耗时判断影响'], '给测试服务加上 GC 日志参数，压测后整理一次回收前后变化。', 'java'],
  ['2025-03-20', 'string-pool-review', 'String、StringBuilder 和字符串常量池复盘', 'Java 基础', ['java'], '理解字符串不可变、拼接优化和常量池的边界。', ['String 不可变便于共享', '循环拼接优先考虑 StringBuilder', 'intern 不是日常业务优化手段'], '比较循环中直接拼接和 StringBuilder 的字节码或耗时。', 'java'],
  ['2025-03-25', 'hashmap-structure-resize', 'HashMap 的底层结构和扩容过程', 'Java 基础', ['java'], '从数组、链表、红黑树和负载因子理解 HashMap。', ['hash 决定桶位置', '扩容会重新分布节点', '可变对象不适合作为 key', '并发写入不能依赖 HashMap'], '手写几个 hash 冲突的 key，观察 put 和 get 的行为。', 'collections'],
  ['2025-03-30', 'arraylist-linkedlist-choice', 'ArrayList 和 LinkedList 不只是查询快慢', 'Java 基础', ['java'], '结合缓存友好性、遍历方式和插入位置选择集合。', ['大多数业务读多写少用 ArrayList', 'LinkedList 随机访问成本高', '容量预估能减少扩容'], '模拟批量导入数据，比较提前指定容量和默认容量。', 'collections'],
  ['2025-04-04', 'equals-hashcode-contract', 'equals 和 hashCode 为什么必须一起看', 'Java 基础', ['java'], '理解对象相等性在集合中的契约。', ['equals 相等则 hashCode 必须相等', '参与比较的字段应尽量稳定', '实体类不要随意把数据库主键和业务唯一键混用'], '写一个错误 hashCode 的对象放进 HashSet，再观察 contains 结果。', 'collections'],
  ['2025-04-09', 'generic-wildcard-erasure', '泛型、通配符和类型擦除整理', 'Java 基础', ['java'], '把泛型看成编译期类型约束，而不是运行期魔法。', ['extends 适合读取', 'super 适合写入', '类型擦除解释了很多运行期限制'], '给一个集合复制方法分别使用 extends 和 super。', 'java'],
  ['2025-04-14', 'exception-handling-boundary', '异常处理：不要只会捕获后打印日志', 'Java 基础', ['java'], '按可恢复、不可恢复和用户可理解程度处理异常。', ['底层保留原因', '边界层转换成业务语义', '不要吞掉异常继续执行', '日志要带上下文'], '把一个文件导入接口拆成参数错误、格式错误和系统错误。', 'java'],
  ['2025-04-19', 'optional-boundary', 'Optional 适合解决什么问题', 'Java 基础', ['java'], '用 Optional 表达可能不存在的返回值，而不是替代所有 null。', ['返回值可以用 Optional', '字段和入参不建议滥用', 'orElseGet 避免提前执行'], '重构一个查询用户昵称的方法，让调用方显式处理缺失。', 'java'],
  ['2025-04-24', 'stream-readability-tradeoff', 'Stream API 写法和可读性的取舍', 'Java 基础', ['java'], '让 Stream 服务于清晰的数据转换，而不是炫技。', ['短链路适合 Stream', '复杂分支考虑普通循环', 'peek 不适合承载业务副作用'], '把订单列表按状态分组，并写出循环版和 Stream 版。', 'java'],
  ['2025-04-29', 'lambda-in-business-code', 'Lambda 表达式在业务代码里的边界', 'Java 基础', ['java'], '用 Lambda 减少样板代码，同时保留调试友好性。', ['函数式接口适合策略差异', '复杂逻辑不要塞进一行表达式', '异常处理要显式设计'], '用 Map 保存不同订单状态的处理函数。', 'java'],
  ['2025-05-04', 'java-time-api-notes', 'Java 时间 API：LocalDateTime 使用笔记', 'Java 基础', ['java'], '区分日期、时间、时区和时间戳。', ['LocalDateTime 不包含时区', '跨系统传输优先明确时区', '数据库字段要统一约定'], '把订单创建时间转成接口返回字符串，明确格式和时区。', 'java'],
  ['2025-05-09', 'bigdecimal-money', 'BigDecimal 金额计算为什么容易出错', 'Java 基础', ['java'], '金额计算要控制精度、舍入和构造方式。', ['避免用 double 构造 BigDecimal', '除法必须考虑舍入模式', '金额单位可以用分降低复杂度'], '实现订单总价、优惠和实付金额计算。', 'java'],
  ['2025-05-14', 'enum-business-status', '枚举类在业务状态流转里的用法', 'Java 基础', ['java'], '把状态码、描述和允许的流转放到同一个语义里。', ['枚举能减少魔法字符串', '状态流转要校验前置状态', '数据库保存 code 而不是 ordinal'], '实现订单从待支付到已取消、已支付的状态校验。', 'java'],
  ['2025-05-19', 'thread-process-concurrency', '线程、进程和并发问题的基本认识', 'Java 并发', ['java'], '先区分执行单元，再讨论共享资源。', ['进程隔离资源', '线程共享进程内存', '并发问题来自共享可变状态'], '用两个线程同时累加同一个计数器，观察错误结果。', 'concurrency'],
  ['2025-05-24', 'synchronized-lock-object', 'synchronized 的锁对象到底是谁', 'Java 并发', ['java'], '锁住的是对象监视器，不是代码片段本身。', ['实例方法锁当前对象', '静态方法锁 Class 对象', '锁范围越小越容易控制影响'], '写两个方法分别锁 this 和锁 private final Object。', 'concurrency'],
  ['2025-05-29', 'reentrantlock-extra-features', 'ReentrantLock 比 synchronized 多了什么', 'Java 并发', ['java'], '理解可中断、可超时、公平锁和条件队列。', ['必须在 finally 里 unlock', 'tryLock 适合失败可降级场景', 'Condition 能拆分等待队列'], '用 tryLock 给库存扣减加一个快速失败分支。', 'concurrency'],
  ['2025-06-03', 'volatile-visibility-ordering', 'volatile 能保证什么，不能保证什么', 'Java 并发', ['java'], 'volatile 解决可见性和有序性，不保证复合操作原子性。', ['状态标记适合 volatile', 'count++ 仍然不是原子操作', '需要原子性时考虑锁或 Atomic 类'], '用 volatile boolean 控制后台任务停止。', 'concurrency'],
  ['2025-06-08', 'thread-pool-parameters', '线程池参数应该怎么设置', 'Java 并发', ['java'], '从任务类型、响应时间和资源限制倒推线程池。', ['CPU 密集和 IO 密集思路不同', '队列长度决定堆积方式', '线程命名便于排查'], '给导出任务设计一个独立线程池。', 'concurrency'],
  ['2025-06-13', 'thread-pool-rejection', '线程池拒绝策略和业务兜底', 'Java 并发', ['java'], '拒绝不是异常情况，而是容量设计的一部分。', ['AbortPolicy 适合快速暴露问题', 'CallerRunsPolicy 会拖慢调用方', '业务任务要能重试或排队'], '模拟线程池打满后接口如何返回友好提示。', 'concurrency'],
  ['2025-06-18', 'completable-future-practice', 'CompletableFuture 的一次异步编排练习', 'Java 并发', ['java'], '把互不依赖的远程调用并行化，同时控制异常和超时。', ['supplyAsync 要指定线程池', 'allOf 只负责等待', '每个子任务都要有降级策略'], '并行查询用户信息、积分和优惠券，再组装首页卡片。', 'concurrency'],
  ['2025-06-23', 'threadlocal-risk', 'ThreadLocal 使用不当会留下什么问题', 'Java 并发', ['java'], 'ThreadLocal 适合线程内上下文，但在线程池里必须清理。', ['请求结束要 remove', '不要保存大对象', '异步线程不会自动继承上下文'], '实现 traceId 上下文并在过滤器 finally 中清理。', 'concurrency'],
  ['2025-06-28', 'reduce-shared-state', '并发场景下如何减少共享状态', 'Java 并发', ['java'], '很多并发问题不是靠加锁解决，而是靠减少共享。', ['不可变对象天然更安全', '局部变量优先于成员变量', '队列能把并发写变成串行消费'], '把批量处理任务改成每个任务独立上下文。', 'concurrency'],
  ['2025-07-03', 'spring-boot-project-layers', 'Spring Boot 项目目录怎么分层', 'Spring', ['spring'], '让包结构反映业务边界，而不是机械地按技术名词堆文件。', ['controller 处理协议', 'service 编排业务', 'repository 负责数据访问', 'domain 保留业务概念'], '给一个订单模块设计 controller、service、mapper、domain。', 'spring'],
  ['2025-07-08', 'controller-business-logic', 'Controller 层到底该写多少逻辑', 'Spring', ['spring'], 'Controller 只做参数接收、校验触发和响应转换。', ['不要直接写 SQL 相关逻辑', '不要散落业务判断', '异常交给统一处理'], '把一个臃肿 Controller 方法拆回 service。', 'spring'],
  ['2025-07-13', 'dto-vo-entity', 'DTO、VO、Entity 分不清会带来什么麻烦', 'Spring', ['spring'], '对象分层是为了隔离变化，不是为了多写几个类。', ['Entity 对应持久化结构', 'DTO 承载接口入参', 'VO 面向页面展示', '转换逻辑要集中'], '给用户列表接口设计查询 DTO 和返回 VO。', 'spring'],
  ['2025-07-18', 'unified-api-response', '统一返回结果是否真的有必要', 'Spring', ['spring'], '统一格式能降低前端处理成本，但要保留 HTTP 语义。', ['成功和失败结构一致', '错误码要稳定', '下载流等场景不要强套'], '设计统一返回对象并处理校验失败和业务失败。', 'spring'],
  ['2025-07-23', 'global-exception-handler', '全局异常处理的一次整理', 'Spring', ['spring'], '把异常转换集中到边界层，让业务代码专注表达失败原因。', ['参数异常返回明确字段', '业务异常返回业务码', '未知异常记录完整日志'], '用 @RestControllerAdvice 统一处理三类异常。', 'spring'],
  ['2025-07-28', 'validation-layer', '参数校验应该放在哪一层', 'Spring', ['spring'], '格式校验靠入口，业务规则靠领域或服务层。', ['空值和长度用 Bean Validation', '跨字段规则写成业务校验', '错误提示要能指导修正'], '实现新增商品接口的入参校验和库存规则校验。', 'spring'],
  ['2025-08-02', 'spring-profile-config', 'Spring 配置文件和多环境管理', 'Spring', ['spring'], '把环境差异收敛到配置，把敏感信息交给部署环境。', ['profile 区分环境', '默认值要谨慎', '密码密钥不要写进仓库'], '整理 dev、test、prod 三套数据库配置。', 'spring'],
  ['2025-08-07', 'spring-bean-lifecycle', 'Bean 生命周期我目前理解到哪一步', 'Spring', ['spring'], '从实例化、依赖注入、初始化到销毁串起 Bean 生命周期。', ['构造方法不适合访问未注入依赖', '初始化逻辑要可重复执行', '销毁阶段释放资源'], '写一个组件打印构造、PostConstruct 和 destroy 顺序。', 'spring'],
  ['2025-08-12', 'dependency-injection-cycle', '依赖注入和循环依赖问题复盘', 'Spring', ['spring'], '循环依赖通常暴露了职责边界不清。', ['构造器注入更容易暴露问题', '懒加载只是缓解不是设计', '拆分服务职责优先'], '把互相调用的 UserService 和 OrderService 拆出协调服务。', 'spring'],
  ['2025-08-17', 'spring-aop-use-case', 'AOP 适合解决什么问题', 'Spring', ['spring'], 'AOP 适合横切关注点，不适合隐藏核心业务流程。', ['日志、权限、幂等适合切面', '复杂业务判断不要放切面', '注意代理失效场景'], '实现一个记录接口耗时的注解和切面。', 'spring'],
  ['2025-08-22', 'spring-transaction-failure', 'Spring 事务为什么会失效', 'Spring', ['spring'], '事务依赖代理、异常类型和数据库能力。', ['同类内部调用可能绕过代理', '默认回滚运行时异常', '方法必须运行在事务管理器控制下'], '复现 self-invocation 导致事务不生效。', 'spring'],
  ['2025-08-27', 'transaction-propagation-scenes', '事务传播行为的几个常见场景', 'Spring', ['spring'], '传播行为决定多个事务方法嵌套时如何参与或新建事务。', ['REQUIRED 是默认选择', 'REQUIRES_NEW 适合独立流水', 'NESTED 依赖保存点能力'], '订单创建失败时保留操作日志。', 'spring'],
  ['2025-09-01', 'spring-event-practice', 'Spring 事件机制的一次小实践', 'Spring', ['spring'], '用事件把主流程和后置动作解耦。', ['事件不应替代明确调用', '异步事件要考虑失败补偿', '事件对象只放必要数据'], '下单成功后发布事件发送站内信。', 'spring'],
  ['2025-09-06', 'scheduled-task-duplicate', '定时任务重复执行怎么避免', 'Spring', ['spring'], '单机定时任务到多实例部署时要重新设计互斥。', ['多实例会重复触发', '分布式锁要有超时', '任务要能幂等重入'], '用 Redis 锁保护每日汇总任务。', 'spring'],
  ['2025-09-11', 'login-flow-from-api', '登录认证流程从接口开始梳理', '认证授权', ['spring', 'engineering'], '从用户名密码提交到接口鉴权梳理完整链路。', ['登录只做身份确认', '认证结果换成令牌或会话', '后续请求校验身份和权限'], '画出登录、刷新令牌和退出登录接口。', 'security'],
  ['2025-09-16', 'jwt-boundary', 'JWT 的优点、问题和使用边界', '认证授权', ['spring'], 'JWT 适合无状态认证，但撤销和续期要额外设计。', ['不要在 JWT 里放敏感信息', '过期时间要合理', '黑名单会引入状态'], '设计 access token 和 refresh token 的刷新流程。', 'security'],
  ['2025-09-21', 'spring-security-filter-chain', 'Spring Security 过滤器链初步理解', '认证授权', ['spring'], '理解请求进入业务接口前经过哪些安全过滤器。', ['认证过滤器提取凭据', '上下文保存身份信息', '授权阶段判断访问权限'], '给一个接口配置登录可访问和管理员可访问两种规则。', 'security'],
  ['2025-09-26', 'permission-in-gateway-or-service', '权限校验应该放在网关还是服务内', '认证授权', ['spring', 'engineering'], '粗粒度准入和细粒度业务权限要分开看。', ['网关适合统一认证和路由拦截', '服务内适合资源级权限', '不要只依赖前端隐藏按钮'], '订单详情接口按用户归属校验访问权限。', 'security'],
  ['2025-10-01', 'mysql-index-not-more-better', 'MySQL 索引为什么不是越多越好', '数据库', ['database'], '索引提升查询，也增加写入和维护成本。', ['索引占用存储', '写入要维护索引结构', '低区分度字段不一定适合单独建索引'], '给用户表的手机号、状态和创建时间设计索引。', 'mysql'],
  ['2025-10-06', 'bplus-tree-index', 'B+ 树索引到底解决了什么问题', '数据库', ['database'], '理解范围查询、排序和磁盘访问之间的关系。', ['多路树降低高度', '叶子节点有序便于范围扫描', '联合索引遵循最左前缀'], '分析 where user_id=? order by created_at desc 的索引。', 'mysql'],
  ['2025-10-11', 'explain-fields', 'explain 执行计划我重点看哪些字段', '数据库', ['database'], '用 explain 判断查询是否走到预期路径。', ['type 反映访问方式', 'key 表示实际使用索引', 'rows 是优化器估算行数', 'Extra 暴露排序和临时表'], '比较加索引前后 explain 输出变化。', 'mysql'],
  ['2025-10-16', 'slow-sql-debugging', '一次慢 SQL 的定位过程', '数据库', ['database'], '慢 SQL 排查要从现象、SQL、索引和数据分布逐步缩小。', ['先确认慢在哪里', '再看执行计划', '最后验证改动效果'], '把一个按时间范围查询的接口从全表扫改成索引扫描。', 'mysql'],
  ['2025-10-21', 'deep-pagination', '分页查询越往后越慢怎么办', '数据库', ['database'], '深分页慢的根源是数据库仍要跳过大量记录。', ['limit offset 会扫描并丢弃前面行', '游标分页适合连续翻页', '后台导出要异步化'], '把消息列表改成基于最后一条 id 的翻页。', 'mysql'],
  ['2025-10-26', 'transaction-isolation-review', '事务隔离级别和脏读、幻读复盘', '数据库', ['database'], '隔离级别是在一致性和并发性能之间取舍。', ['读未提交风险最高', '读已提交避免脏读', '可重复读关注同一事务内一致视图'], '用两个会话演示同一行数据更新后的读取差异。', 'mysql'],
  ['2025-10-31', 'optimistic-pessimistic-lock', '乐观锁和悲观锁的使用边界', '数据库', ['database'], '根据冲突概率和用户体验选择锁策略。', ['乐观锁适合低冲突', '悲观锁适合强一致扣减', '失败后要有重试或提示'], '用 version 字段实现商品库存更新。', 'mysql'],
  ['2025-11-05', 'mybatis-dynamic-sql', 'MyBatis 动态 SQL 写法整理', '数据库', ['database'], '动态 SQL 要服务于可读性，不能把条件拼接写散。', ['if 控制可选条件', 'where 自动处理前缀', 'foreach 处理批量参数', '复杂查询要保留 SQL 可解释性'], '写一个订单列表的组合筛选查询。', 'mysql'],
  ['2025-11-10', 'mybatis-pagination-plugin', 'MyBatis 分页插件和 SQL 可控性', '数据库', ['database'], '分页插件减少重复代码，但要理解最终执行的 SQL。', ['确认 count SQL 是否合理', '大表分页要限制条件', '导出不要复用普通分页接口'], '给后台列表接口加分页和排序白名单。', 'mysql'],
  ['2025-11-15', 'database-field-design', '数据库字段设计的一些小原则', '数据库', ['database'], '字段设计要让约束、含义和演进成本清晰。', ['字段名表达业务含义', '状态字段要有枚举约束', '金额和时间类型要统一', '保留审计字段'], '设计一张优惠券领取记录表。', 'mysql'],
  ['2025-11-20', 'redis-data-structures', 'Redis 常用数据结构和适用场景', '缓存与中间件', ['database'], '先按访问模式选结构，再谈命令。', ['String 适合简单缓存和计数', 'Hash 适合对象局部字段', 'Set 适合去重', 'ZSet 适合排行榜'], '用 Redis 设计文章点赞、收藏和排行榜。', 'redis'],
  ['2025-11-25', 'cache-penetration-breakdown-avalanche', '缓存穿透、击穿、雪崩重新整理', '缓存与中间件', ['database'], '三个问题都表现为压力打到数据库，但成因不同。', ['穿透来自不存在数据', '击穿来自热点 key 失效', '雪崩来自大量 key 同时失效'], '给商品详情缓存加空值缓存、互斥重建和随机过期。', 'redis'],
  ['2025-11-30', 'cache-consistency', '缓存一致性不能只靠删除缓存', '缓存与中间件', ['database'], '缓存一致性要结合读写路径、失败重试和容忍时间。', ['先更新数据库再删缓存是常见选择', '删除失败要补偿', '强一致场景不要轻易加缓存'], '设计商品价格更新后的缓存删除和消息补偿。', 'redis'],
  ['2025-12-05', 'distributed-lock-boundary', '分布式锁应该注意哪些边界', '缓存与中间件', ['database'], '锁只解决互斥，不自动保证业务正确。', ['锁要有过期时间', '释放锁要校验持有者', '业务执行超时要考虑续期或失败'], '用 Redis 锁保护优惠券发放。', 'redis'],
  ['2025-12-10', 'redis-expire-details', 'Redis 过期时间设置的几个细节', '缓存与中间件', ['database'], '过期时间既影响命中率，也影响系统压力曲线。', ['热点 key 过期要错开', '永久 key 要有清理策略', '业务变更时主动删除缓存'], '给首页配置缓存设置随机过期时间。', 'redis'],
  ['2025-12-15', 'mq-peak-shaving-boundary', 'MQ 为什么能削峰，但不能解决所有问题', '缓存与中间件', ['engineering'], '消息队列把同步压力转成异步处理，但增加最终一致性复杂度。', ['生产者要确认发送结果', '消费者要能重复执行', '积压要有监控和降级'], '把下单后的积分发放改成异步消息。', 'mq'],
  ['2025-12-20', 'message-duplicate-idempotent', '消息重复消费和幂等处理', '缓存与中间件', ['engineering'], '消费者必须假设消息可能重复到达。', ['用业务唯一键去重', '数据库唯一约束兜底', '消费状态要可查询'], '用订单号和消息类型做消费记录表。', 'mq'],
  ['2025-12-25', 'message-retry-dlq', '消息重试、死信队列和人工补偿', '缓存与中间件', ['engineering'], '失败处理要分清临时失败和永久失败。', ['网络抖动适合重试', '参数错误不该无限重试', '死信消息要能告警和回放'], '设计优惠券发放失败后的死信处理流程。', 'mq'],
  ['2025-12-30', 'api-idempotency-options', '接口幂等设计的几种方案', '工程实践', ['engineering'], '幂等的目标是同一请求多次执行结果可控。', ['天然幂等可以靠状态判断', '提交类接口可用请求号', '支付回调依赖业务流水号'], '给创建订单接口加 requestId 防重复提交。', 'engineering'],
  ['2026-01-04', 'rate-limit-protects-what', '限流是在保护系统还是保护用户体验', '工程实践', ['engineering'], '限流不是拒绝用户，而是在过载时保持核心功能可用。', ['按接口、用户和来源分维度', '返回明确的重试提示', '限流要配合监控'], '给短信验证码接口设计用户维度限流。', 'engineering'],
  ['2026-01-09', 'sentinel-rate-limit-practice', 'Sentinel 限流降级入门实践', '工程实践', ['spring', 'engineering'], '用规则把流量控制从业务代码中抽离出来。', ['资源名要稳定', '降级返回要符合业务语义', '规则变更要可观察'], '给商品查询接口加一个简单限流规则。', 'spring'],
  ['2026-01-14', 'openfeign-failure-debug', 'OpenFeign 调用失败怎么排查', '微服务', ['spring', 'engineering'], '远程调用失败要从网络、序列化、超时和下游错误分层排查。', ['先看请求是否发出', '再看状态码和响应体', '最后确认超时配置'], '模拟库存服务超时并给订单服务加降级。', 'spring'],
  ['2026-01-19', 'gateway-responsibilities', '网关层应该承担哪些职责', '微服务', ['spring', 'engineering'], '网关适合处理跨服务的入口能力，不适合写业务细节。', ['统一认证', '路由转发', '限流熔断', '日志追踪'], '设计用户服务和订单服务的网关路由。', 'spring'],
  ['2026-01-24', 'service-timeout-fallback', '服务超时之后如何做兜底', '微服务', ['spring', 'engineering'], '兜底要明确返回的是降级结果，而不是假装成功。', ['读接口可返回缓存', '写接口要谨慎降级', '超时参数要小于调用方等待时间'], '给用户画像接口加缓存兜底。', 'spring'],
  ['2026-01-29', 'trace-id-log', '日志链路 ID 帮我少走了多少弯路', '工程实践', ['engineering'], '链路 ID 让一次请求在多层日志中能被串起来。', ['入口生成 traceId', '跨服务透传 header', '异步任务要手动带上下文'], '用过滤器和 MDC 给接口日志加 traceId。', 'engineering'],
  ['2026-02-03', 'api-log-content', '接口日志应该记录什么，不该记录什么', '工程实践', ['engineering'], '日志要服务排查，同时控制隐私和噪声。', ['记录请求路径和关键参数', '敏感字段脱敏', '大对象不要全量打印', '异常日志保留堆栈'], '给登录接口做手机号和密码脱敏。', 'engineering'],
  ['2026-02-08', 'linux-java-debug-commands', 'Linux 上排查 Java 服务的常用命令', '工程实践', ['engineering'], '从进程、端口、日志和资源使用四个角度定位问题。', ['ps 看进程', 'ss 看端口', 'tail 和 grep 看日志', 'jstack 辅助看线程'], '记录一次服务启动失败的排查命令。', 'engineering'],
  ['2026-02-13', 'nginx-reverse-proxy-review', 'Nginx 反向代理配置复盘', '工程实践', ['engineering'], '反向代理要关注请求头、路径转发和超时。', ['proxy_pass 路径要仔细验证', '保留真实 IP 需要转发头', '上传接口要配置大小限制'], '把前端域名代理到后端 Spring Boot 服务。', 'engineering'],
  ['2026-02-18', 'docker-spring-boot-deploy', 'Docker 部署 Spring Boot 项目', '工程实践', ['engineering'], '容器化重点是可重复运行和环境隔离。', ['镜像只放运行需要的内容', '配置通过环境变量注入', '日志输出到标准输出'], '写一个 Spring Boot 应用的 Dockerfile。', 'engineering'],
  ['2026-02-23', 'maven-dependency-conflict', 'Maven 依赖冲突的一次排查', '工程实践', ['engineering'], '依赖冲突要看最终生效版本，而不是只看 pom。', ['dependency:tree 找来源', '就近原则影响版本选择', 'dependencyManagement 统一版本'], '排查一个 Jackson 版本不一致导致的启动问题。', 'engineering'],
  ['2026-02-28', 'git-branch-commit-rules', 'Git 分支管理和提交规范整理', '工程实践', ['engineering'], '清晰的分支和提交记录能降低协作成本。', ['功能分支聚焦单一需求', '提交信息说明原因', '合并前先自测'], '整理一次从 feature 分支到 main 的合并流程。', 'engineering'],
  ['2026-03-05', 'unit-test-not-coverage-only', '单元测试不是为了凑覆盖率', '测试', ['engineering'], '测试要锁定行为，帮助重构时发现回归。', ['优先测分支和边界', '外部依赖用替身', '测试名表达场景和期望'], '给优惠券金额计算写三个边界测试。', 'test'],
  ['2026-03-10', 'mockito-pitfalls', 'Mockito 写测试时我踩过的坑', '测试', ['engineering'], 'Mock 是隔离依赖的工具，不是让测试通过的遮羞布。', ['不要 mock 被测对象核心逻辑', '验证交互要有业务意义', 'stub 要覆盖异常分支'], '给订单服务 mock 库存服务返回不足。', 'test'],
  ['2026-03-15', 'integration-test-scope', '集成测试应该测到什么程度', '测试', ['engineering'], '集成测试关注组件协作，不必覆盖所有细节。', ['启动真实 Spring 上下文', '核心链路走真实配置', '外部系统用测试容器或替身'], '测试创建订单接口从 Controller 到数据库的完整链路。', 'test'],
  ['2026-03-20', 'api-doc-frontend-backend', '接口文档和前后端联调流程整理', '工程实践', ['engineering'], '接口文档是协作契约，不是上线前补的说明。', ['字段含义要明确', '错误码要列出来', '示例请求和响应要能直接使用'], '给登录接口补齐成功、失败和过期响应示例。', 'engineering'],
  ['2026-03-25', 'code-review-focus', '代码 Review 时我会重点看什么', '工程实践', ['engineering'], 'Review 不是挑刺，而是提前发现设计和维护问题。', ['先看需求是否实现', '再看边界和异常', '最后看命名和重复代码'], '按清单 Review 一个新增接口。', 'engineering'],
  ['2026-03-30', 'backend-api-release-flow', '一个后端接口从需求到上线的流程', '工程实践', ['engineering'], '把需求拆成设计、编码、自测、联调、上线和复盘。', ['需求阶段问清边界', '开发阶段留下测试', '上线阶段准备回滚方案'], '梳理新增优惠券领取接口的完整流程。', 'engineering'],
  ['2026-04-04', 'user-permission-table-design', '小项目的用户表和权限表设计', '项目实践', ['database', 'engineering'], '用户权限设计从简单可用开始，避免一上来过度复杂。', ['用户表保存身份基础信息', '角色表表达权限集合', '关联表解决多对多'], '设计用户、角色、菜单和用户角色关联表。', 'mysql'],
  ['2026-04-09', 'file-upload-api', '文件上传接口的限制、安全和存储', '项目实践', ['spring', 'engineering'], '上传接口要同时考虑用户体验和安全边界。', ['限制大小和类型', '文件名不能直接信任', '存储路径和访问路径分离'], '实现头像上传并返回可访问 URL。', 'spring'],
  ['2026-04-14', 'excel-import-design', 'Excel 导入为什么容易写乱', '项目实践', ['spring', 'engineering'], '导入流程要拆成解析、校验、预览、入库和错误反馈。', ['不要边读边直接入库', '错误行要能定位', '大文件要异步处理'], '设计商品批量导入的错误报告。', 'spring'],
  ['2026-04-19', 'order-status-flow', '订单状态流转应该怎么设计', '项目实践', ['java', 'engineering'], '订单状态是业务约束，不能只靠前端按钮控制。', ['状态机明确允许流转', '每次变更记录操作日志', '并发修改要校验当前状态'], '实现待支付、已支付、已取消之间的流转。', 'java'],
  ['2026-04-24', 'payment-callback-idempotency', '支付回调接口为什么必须幂等', '项目实践', ['engineering'], '支付回调可能重复到达，系统必须保证只处理一次业务结果。', ['用支付流水号去重', '更新订单时校验状态', '回调日志要可追踪'], '设计支付成功回调的处理流程。', 'engineering'],
  ['2026-04-29', 'admin-list-filter-export', '后台管理系统的分页、筛选和导出', '项目实践', ['spring', 'database'], '后台列表看似简单，实际包含查询性能和权限边界。', ['筛选条件要建模', '排序字段要白名单', '导出任务要异步'], '实现订单后台列表和导出任务。', 'mysql'],
  ['2026-05-04', 'pre-release-checklist', '项目上线前我会检查哪些配置', '工程实践', ['engineering'], '上线检查要覆盖配置、数据库、日志、监控和回滚。', ['环境变量是否正确', '数据库脚本是否可重复执行', '日志级别是否合适', '回滚包是否准备好'], '给一次小版本上线写检查清单。', 'engineering'],
  ['2026-05-09', 'production-incident-review', '线上问题复盘：先保留现场再改代码', '工程实践', ['engineering'], '复盘先还原事实，再分析原因，最后落实改进。', ['不要急着重启掩盖现场', '保存日志和请求样例', '区分直接原因和根因'], '复盘一次接口超时导致的告警。', 'engineering'],
  ['2026-05-14', 'spring-boot-starter-template', '从零整理一个 Spring Boot 后端脚手架', '项目实践', ['spring', 'engineering'], '脚手架要沉淀通用能力，同时保持轻量。', ['统一异常和返回', '基础日志和 traceId', '参数校验', '常用依赖版本管理'], '搭建一个包含用户模块的最小后端模板。', 'spring'],
  ['2026-05-19', 'ai-tools-learning', 'AI 工具辅助学习时怎么避免假懂', 'AI 实践', ['engineering'], 'AI 可以加速搜索和解释，但最终要回到代码和文档验证。', ['让 AI 给出可运行例子', '关键结论回查官方文档', '把输出改写成自己的判断'], '用 AI 辅助理解 ThreadLocal 后写一个验证代码。', 'ai'],
  ['2026-05-24', 'prompt-code-quality', 'Prompt 写得清楚，代码质量才有上限', 'AI 实践', ['engineering'], '提示词不是玄学，本质是把需求、约束和验收标准说清楚。', ['说明技术栈和现有代码', '写清楚不要改什么', '要求给出测试和边界'], '给一个接口重构任务写更完整的提示。', 'ai'],
  ['2026-05-29', 'spring-ai-learning-plan', 'Spring AI 是什么，我准备怎么学', 'AI 实践', ['spring', 'engineering'], '先理解 Spring AI 的抽象，再考虑接入具体模型。', ['ChatClient 负责对话调用', 'EmbeddingModel 负责向量化', 'VectorStore 负责检索存储'], '用最小 Demo 调一次模型接口并打印响应。', 'ai'],
  ['2026-06-03', 'rag-retrieval-chunk-embedding', 'RAG 的检索、切片和向量化流程', 'AI 实践', ['spring', 'database'], 'RAG 的关键不是把文档塞进去，而是让问题能找回正确片段。', ['清洗文档保留结构', '切片要兼顾语义完整', '向量检索后还要重排或过滤'], '把一篇项目文档切成片段并保存元数据。', 'ai'],
  ['2026-06-08', 'redis-vector-search-basics', '用 Redis 做向量检索前我先搞懂了什么', 'AI 实践', ['database', 'engineering'], '向量检索要理解索引、距离和元数据过滤。', ['向量维度必须一致', '相似度不等于事实正确', '过滤条件能减少无关结果'], '给文档片段保存标题、来源和更新时间。', 'ai'],
  ['2026-06-13', 'knowledge-base-qa-backend', '一个知识库问答 Demo 的后端设计', 'AI 实践', ['spring', 'engineering'], '问答系统要把上传、索引、检索、生成和反馈拆开。', ['上传阶段做解析', '索引阶段做切片和向量化', '问答阶段返回引用片段', '反馈用于后续优化'], '设计文档上传接口和问答接口。', 'ai'],
  ['2026-06-15', 'prompt-debugging-workflow', '用 AI 辅助排查问题时我怎么提问', 'AI 实践', ['engineering'], '排查类提示词要提供现象、环境、日志、已尝试方案和期望输出。', ['先给最小现场信息', '让 AI 列排查顺序而不是直接改代码', '关键命令和结论要自己验证'], '把一次接口 500 的日志整理成可复查的提问材料。', 'ai'],
  ['2026-06-16', 'ai-generated-code-review', 'AI 生成的代码为什么还要认真 Review', 'AI 实践', ['engineering'], 'AI 能快速产出代码，但不能替我承担设计、边界和上线责任。', ['先看需求是否真的满足', '再看异常和并发边界', '最后跑测试和静态检查'], '审查一段 AI 生成的 Controller 和 Service。', 'ai'],
  ['2026-06-17', 'personal-knowledge-base-plan', '个人技术知识库应该怎么整理', 'AI 实践', ['engineering'], '知识库不是资料仓库，而是能支持检索、复习和项目决策的材料系统。', ['原始资料和个人理解分开保存', '每篇笔记要有来源和适用场景', '定期清理过时内容'], '把博客文章、项目复盘和代码片段整理成可检索目录。', 'ai'],
  ['2026-06-18', 'one-year-blog-review', '技术博客这一年：哪些内容真的帮到了我', '工程复盘', ['engineering'], '复盘不是统计篇数，而是看哪些笔记真的指导了行动。', ['能复现的笔记价值最高', '只有结论的文章很快失效', '项目复盘比概念摘抄更耐看'], '挑三篇文章补充代码和排查过程。', 'engineering'],
  ['2026-06-21', 'next-learning-plan', '下一阶段学习计划：从会写到写得稳', '工程复盘', ['engineering'], '下一阶段重点从能实现功能转向稳定性、可维护性和系统设计。', ['补齐测试习惯', '加强数据库和缓存设计', '练习线上问题排查', '继续做项目复盘'], '给未来两个月列出可执行的学习任务。', 'engineering'],
];

function assertInside(child, parent) {
  const relative = path.relative(parent, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refuse to touch path outside ${parent}: ${child}`);
  }
}

function removeMarkdownFiles(dir, keep = new Set()) {
  fs.mkdirSync(dir, {recursive: true});
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || keep.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    assertInside(full, dir);
    fs.unlinkSync(full);
  }
}

function yamlList(items) {
  return items.map((item) => `  - ${item}`).join('\n');
}

function slugToHexoFile(post) {
  return `${post[0]}-${post[1]}.md`;
}

function escapeYaml(value) {
  return String(value).replaceAll('"', '\\"');
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateTime(date) {
  return `${formatDate(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function buildPublishSchedule(total) {
  const dayPattern = [
    0, 5, 7, 3, 8, 4, 0, 6, 9, 5,
    7, 4, 2, 8, 5, 6, 0, 7, 3, 9,
    5, 4, 7, 6, 0, 8, 3, 5, 9, 4,
    2, 7, 6, 0, 8, 5, 4, 9, 3, 7,
    0, 6, 5, 8, 4, 2, 7, 9, 0, 6,
  ];
  const hourPattern = [9, 11, 14, 20, 10, 16, 21, 13, 19, 8];
  const minutePattern = [12, 38, 7, 26, 51, 18, 44, 5, 33, 57];
  const schedule = [];
  let current = new Date(2025, 2, 1, 9, 12, 0);

  for (let index = 0; index < total; index += 1) {
    if (index > 0) {
      current = addDays(current, dayPattern[(index - 1) % dayPattern.length]);
    }
    const postTime = new Date(current);
    postTime.setHours(hourPattern[index % hourPattern.length], minutePattern[index % minutePattern.length], 0, 0);
    schedule.push(postTime);
  }

  return schedule;
}

const publishSchedule = buildPublishSchedule(posts.length);

function normalizeCategory(topic) {
  const [, slug, , category, tags, , , , refKey] = topic;
  const tagSet = new Set(tags);

  if (
    category.includes('Java') ||
    refKey === 'java' ||
    refKey === 'collections' ||
    refKey === 'concurrency' ||
    slug.includes('jvm') ||
    slug.includes('thread')
  ) {
    return 'Java 基础';
  }

  if (
    category.includes('Spring') ||
    category.includes('认证') ||
    category.includes('微服务') ||
    category.includes('项目实践') ||
    refKey === 'spring' ||
    refKey === 'security' ||
    tagSet.has('spring')
  ) {
    return '后端框架';
  }

  if (
    category.includes('数据库') ||
    category.includes('缓存') ||
    refKey === 'mysql' ||
    refKey === 'redis' ||
    refKey === 'mq' ||
    tagSet.has('database')
  ) {
    return '数据库与中间件';
  }

  return '杂七杂八';
}

function exampleCode(topic) {
  const slug = topic[1];
  if (slug.includes('thread-pool')) {
    return `ExecutorService pool = new ThreadPoolExecutor(
    4,
    8,
    60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),
    new ThreadFactoryBuilder().setNameFormat("export-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);`;
  }
  if (slug.includes('transaction')) {
    return `@Transactional
public void pay(Long orderId) {
    Order order = orderRepository.getById(orderId);
    order.markPaid();
    orderRepository.save(order);
}`;
  }
  if (slug.includes('mysql') || slug.includes('sql') || slug.includes('pagination') || slug.includes('index') || slug.includes('explain')) {
    return `EXPLAIN
SELECT id, user_id, status, created_at
FROM orders
WHERE user_id = ? AND status = ?
ORDER BY created_at DESC
LIMIT 20;`;
  }
  if (slug.includes('redis') || slug.includes('cache') || slug.includes('lock')) {
    return `String key = "order:" + orderId;
Order cached = redisTemplate.opsForValue().get(key);
if (cached != null) {
    return cached;
}`;
  }
  if (slug.includes('test') || slug.includes('mockito')) {
    return `@Test
void shouldRejectWhenStockNotEnough() {
    when(stockClient.enough(anyLong(), anyInt())).thenReturn(false);
    assertThrows(BusinessException.class, () -> orderService.create(command));
}`;
  }
  if (slug.includes('jwt') || slug.includes('security') || slug.includes('login')) {
    return `if (!tokenService.valid(token)) {
    throw new UnauthorizedException("登录已过期");
}
SecurityContext.setCurrentUser(tokenService.parseUser(token));`;
  }
  if (slug.includes('rag') || slug.includes('spring-ai') || slug.includes('vector') || slug.includes('knowledge-base') || slug.includes('ai-tools') || slug.includes('prompt') || slug.includes('personal-knowledge') || slug.includes('generated-code')) {
    return `List<Document> chunks = splitter.split(document);
vectorStore.add(chunks);
List<Document> matched = vectorStore.similaritySearch(question);`;
  }
  return `public Result<Void> handle(Command command) {
    validator.check(command);
    service.execute(command);
    return Result.ok();
}`;
}

function section(title, body) {
  return `## ${title}\n\n${body}`;
}

function renderRefs(refKey) {
  return (refs[refKey] || refs.engineering)
    .map(([name, url]) => `- [${name}](${url})`)
    .join('\n');
}

function quickAnswer(point) {
  const normalized = point.replace(/。$/, '');
  return `- ${normalized}。\n  我现在的理解：先记结论，再回到代码里找一个能验证它的场景。`;
}

function buildQaBody(topic, code, referenceList) {
  const [, , title, , , summary, points, scenario] = topic;
  return [
    `今天不想写长文，先把 **${title}** 这块拆成几条短一点的问答。面试里经常会被连续追问，如果只背一句定义，第二问基本就卡住了。`,
    '',
    section('先说我自己的结论', `${summary}\n\n我现在会先把这类题分成“定义是什么、为什么这样设计、代码里怎么用、容易翻车在哪”四层去答。这样比死背一段话稳很多。`),
    '',
    section('快问快答', points.map((point) => quickAnswer(point)).join('\n')),
    '',
    section('如果在项目里问到我', `我会直接拿这个场景来讲：${scenario}\n\n这样回答有个好处，不会显得像在背书，因为每一句都能落到接口、表结构、线程、缓存或者日志上。`),
    '',
    section('一个最小例子', `\`\`\`${code.startsWith('EXPLAIN') ? 'sql' : 'java'}\n${code}\n\`\`\`\n\n这个例子不求大而全，只求能把核心点钉住。写完后我一般会补一个反例，看看自己是不是只会顺着讲。`),
    '',
    section('我会继续追问自己什么', [
      `- 这道题最容易和哪个概念混在一起。`,
      `- 如果业务量上来，它会不会变成性能问题。`,
      `- 如果线上出故障，我第一步会看日志、线程、SQL 还是缓存。`,
    ].join('\n')),
    '',
    section('参考资料', referenceList),
  ].join('\n');
}

function buildPitfallBody(topic, code, referenceList) {
  const [, , title, , , summary, points, scenario] = topic;
  return [
    `这篇按踩坑笔记来写，因为 **${title}** 我现在更容易记住“错在哪”，而不是“定义长什么样”。`,
    '',
    section('先记住这句话', `${summary}\n\n很多问题不是不会用，而是用得太顺手了，顺手到把边界条件给省掉了。`),
    '',
    section('这类问题一般怎么出现', `我脑子里会先放这个场景：${scenario}\n\n一开始看着都像是个小问题，真正麻烦的是它往往不是立刻报错，而是跑一阵子、数据一多、并发一上来才暴露。`),
    '',
    section('这次我想盯住的坑', points.map((point, index) => `${index + 1}. ${point}`).join('\n')),
    '',
    section('一个最小复现场景', `\`\`\`${code.startsWith('EXPLAIN') ? 'sql' : 'java'}\n${code}\n\`\`\`\n\n如果连最小复现都写不出来，其实大概率只是“看懂了别人的总结”，还没有真正掌握。`),
    '',
    section('面试里如果被追问', [
      `- 先说结论，再补为什么会这样。`,
      `- 说一个自己见过或能想象到的翻车场景。`,
      `- 最后补上规避办法，而不是停在概念层。`,
    ].join('\n')),
    '',
    section('这篇学完至少别再犯的错', [
      `- 只记 happy path，不补失败分支。`,
      `- 看见示例能跑就默认线上也安全。`,
      `- 不看日志、不做验证，直接凭感觉改。`,
    ].join('\n')),
    '',
    section('参考资料', referenceList),
  ].join('\n');
}

function buildDebugBody(topic, code, referenceList) {
  const [, , title, , , summary, points, scenario] = topic;
  return [
    `这篇我想按“排查记录”来写，主题是 **${title}**。这种写法比纯概念文更适合我自己回看。`,
    '',
    section('现象先别急着解释', `${summary}\n\n先把现象钉住，比急着下结论有用。很多时候真正的关键不是“答案是什么”，而是“我是怎么一步步排到这里的”。`),
    '',
    section('我会先看哪几件事', points.map((point) => `- ${point}`).join('\n')),
    '',
    section('带入一个排查场景', `${scenario}\n\n如果这是线上问题，我通常会先保留日志和上下文，再去缩小范围：是入参问题、状态问题、并发问题、数据库问题，还是调用链上的某一环超时了。`),
    '',
    section('排查时能落地的片段', `\`\`\`${code.startsWith('EXPLAIN') ? 'sql' : 'java'}\n${code}\n\`\`\`\n\n我比较在意的是这段代码能不能帮我继续观察，而不是它看起来是否“完整”。`),
    '',
    section('写给自己的复盘', [
      `- 下次再遇到类似问题，先证据、后判断。`,
      `- 能打印的关键日志别省。`,
      `- 结论一定要能回到文档、代码或命令结果上。`,
    ].join('\n')),
    '',
    section('参考资料', referenceList),
  ].join('\n');
}

function buildStudyNotesBody(topic, code, referenceList) {
  const [, , title, , , summary, points, scenario] = topic;
  return [
    `今天把 **${title}** 补成一篇正常一点的学习笔记，不写大而全，就记我这轮最想吃透的部分。`,
    '',
    section('一句话先立住', summary),
    '',
    section('我这次真正记住的点', points.map((point) => `- ${point}`).join('\n')),
    '',
    section('为什么我会专门记这块', `因为它很容易出现一种错觉：看资料的时候觉得自己会了，真到写接口、改 SQL、配事务、看线程池参数时又开始发虚。\n\n我现在尽量把知识点挂到一个具体场景上：${scenario}`),
    '',
    section('先留一段能跑的东西', `\`\`\`${code.startsWith('EXPLAIN') ? 'sql' : 'java'}\n${code}\n\`\`\`\n\n有了这段最小代码，后面不管是补测试、补异常分支，还是拿去问 AI / 查文档，心里都会稳一些。`),
    '',
    section('面试回答别太书面', [
      `我会先说结论，再说原因。`,
      `然后补一个项目里的使用场景。`,
      `最后说边界：它不解决什么，或者什么情况下会失效。`,
    ].join('\n')),
    '',
    section('参考资料', referenceList),
  ].join('\n');
}

function articleBody(topic, index) {
  const [, slug, title, , , , , , refKey] = topic;
  const referenceList = renderRefs(refKey);
  const code = exampleCode(topic);
  const style = index % 4;
  if (slug.includes('pitfall') || slug.includes('failure') || slug.includes('duplicate') || slug.includes('debug') || slug.includes('incident')) {
    return buildPitfallBody(topic, code, referenceList);
  }
  if (slug.includes('explain') || slug.includes('slow-sql') || slug.includes('trace') || slug.includes('review')) {
    return buildDebugBody(topic, code, referenceList);
  }
  if (slug.includes('why') || slug.includes('plan') || slug.includes('questions') || slug.includes('choice') || style === 1) {
    return buildQaBody(topic, code, referenceList);
  }
  if (style === 2) {
    return buildPitfallBody(topic, code, referenceList);
  }
  if (style === 3) {
    return buildDebugBody(topic, code, referenceList);
  }
  return buildStudyNotesBody(topic, code, referenceList);
}

function writeContentPost(topic, index) {
  const [, slug, title, , tags, summary] = topic;
  const publishAt = publishSchedule[index];
  const updatedAt = new Date(publishAt);
  updatedAt.setMinutes(updatedAt.getMinutes() + 23 + (index % 17));
  const datetime = formatDateTime(publishAt);
  const updated = formatDateTime(updatedAt);
  const frontMatter = `---\ntitle: ${escapeYaml(title)}\ndate: ${datetime}\nupdated: ${updated}\ntags:\n${yamlList(tags)}\ncategories:\n  - ${normalizeCategory(topic)}\ndescription: ${escapeYaml(summary)}\ncover: ${covers[index % covers.length]}\nabbrlink: ${slug}\n---\n\n`;
  const categoryDir = path.join(contentRootDir, normalizeCategory(topic));
  fs.mkdirSync(categoryDir, {recursive: true});
  fs.writeFileSync(path.join(categoryDir, slugToHexoFile(topic)), frontMatter + articleBody(topic, index), 'utf8');
}

function seedAnalytics() {
  fs.mkdirSync(path.dirname(analyticsFile), {recursive: true});
  const data = {posts: {}, visits: []};
  fs.writeFileSync(analyticsFile, JSON.stringify(data, null, 2), 'utf8');
}

function main() {
  if (posts.length !== 100) {
    throw new Error(`Expected 100 posts, got ${posts.length}`);
  }

  fs.rmSync(contentRootDir, {recursive: true, force: true});
  fs.mkdirSync(contentRootDir, {recursive: true});

  for (let index = 0; index < posts.length; index += 1) {
    writeContentPost(posts[index], index);
  }
  seedAnalytics();

  console.log(`Rebuilt ${posts.length} content markdown file(s).`);
  console.log(`Seeded local analytics at ${analyticsFile}.`);
}

main();




