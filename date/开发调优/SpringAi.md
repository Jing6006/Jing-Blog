---
title: Spring AI 在 Java 项目中的实践应用
date: 2024-12-05 16:00:00
categories:
  - 开发调优
tags:
  - Spring AI
  - Java
  - RAG
  - AI应用开发
description: 详细介绍 Spring AI 框架的核心功能，包括多轮对话、RAG 知识库构建、Function Calling 等实际应用场景。
---

## Spring AI 框架简介

Spring AI 是 Spring 官方推出的面向 Java 生态的 AI 应用开发框架，提供了标准化的大模型接入与 AI 应用编排能力。

### 核心特性

- **统一的 API 接口**：屏蔽不同大模型厂商的接口差异
- **原生 Spring Boot 集成**：与现有 Java 技术栈无缝对接
- **丰富的组件支持**：对话管理、向量嵌入、文档处理、函数调用
- **多模型兼容**：支持 OpenAI、Azure OpenAI、本地模型等

相比传统方案，Spring AI 避免了手动封装 HTTP 接口、跨语言服务运维的额外成本，让 Java 开发者能够快速构建 AI 应用。

### 核心架构

```
┌─────────────────────────────────────────┐
│         Spring AI Application           │
├─────────────────────────────────────────┤
│  Chat │ Embedding │ Image │ Function   │
├─────────────────────────────────────────┤
│        Model Abstraction Layer          │
├─────────────────────────────────────────┤
│  OpenAI │ Azure │ Ollama │ Local Model │
└─────────────────────────────────────────┘
```

---

## 多轮对话能力实现

### 核心问题

在对话系统中，单轮问答无法满足实际需求：
- 用户会使用代词指代（"它"、"这个"、"刚才那个"）
- 需要基于上文理解当前问题
- 长对话会导致 token 消耗激增

### 实现方案

#### 1. 对话历史管理

Spring AI 提供了 `ChatMemory` 组件用于管理对话上下文：

```java
@Service
public class ChatService {
    
    private final ChatClient chatClient;
    private final InMemoryChatMemory chatMemory;
    
    public ChatService(ChatClient.Builder chatClientBuilder) {
        this.chatMemory = new InMemoryChatMemory();
        this.chatClient = chatClientBuilder
            .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
            .build();
    }
    
    public String chat(String conversationId, String userMessage) {
        // 对话历史自动注入上下文
        return chatClient.prompt()
            .user(userMessage)
            .advisors(a -> a.param(MessageChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY, conversationId))
            .call()
            .content();
    }
}
```

#### 2. 滑动窗口优化

为避免 token 无限增长，采用滑动窗口策略：

```java
@Component
public class SlidingWindowChatMemory implements ChatMemory {
    
    private static final int MAX_MESSAGES = 10;  // 保留最近10条消息
    private final Map<String, List<Message>> conversations = new ConcurrentHashMap<>();
    
    @Override
    public void add(String conversationId, List<Message> messages) {
        conversations.compute(conversationId, (key, oldMessages) -> {
            List<Message> newMessages = new ArrayList<>(oldMessages != null ? oldMessages : Collections.emptyList());
            newMessages.addAll(messages);
            
            // 只保留最近的N条消息
            if (newMessages.size() > MAX_MESSAGES) {
                newMessages = newMessages.subList(newMessages.size() - MAX_MESSAGES, newMessages.size());
            }
            
            return newMessages;
        });
    }
    
    @Override
    public List<Message> get(String conversationId, int lastN) {
        return conversations.getOrDefault(conversationId, Collections.emptyList());
    }
}
```

#### 3. 对话摘要压缩

对于超出窗口的历史对话，使用大模型生成摘要：

```java
public String summarizeHistory(List<Message> messages) {
    String prompt = """
        请将以下对话历史总结为简洁的摘要，保留关键信息：
        
        %s
        
        摘要：
        """.formatted(formatMessages(messages));
    
    return chatClient.prompt()
        .user(prompt)
        .call()
        .content();
}
```

### 完整示例

```java
@RestController
@RequestMapping("/api/chat")
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @PostMapping("/message")
    public ChatResponse sendMessage(@RequestBody ChatRequest request) {
        String conversationId = request.getConversationId();
        String userMessage = request.getMessage();
        
        // 自动带上对话历史
        String response = chatService.chat(conversationId, userMessage);
        
        return new ChatResponse(response);
    }
}
```

---

## RAG 知识库搭建

### 什么是 RAG

RAG（Retrieval-Augmented Generation，检索增强生成）是一种结合知识库检索和大模型生成的技术方案，用于解决：

1. **知识时效性问题**：大模型训练数据有截止日期，无法获取最新信息
2. **领域知识缺失**：通用大模型不了解企业内部的业务规则
3. **幻觉问题**：大模型可能生成不准确或虚假的内容

### RAG 工作流程

```
用户提问 → 向量化 → 向量检索 → 召回相关文档 → 构造Prompt → 大模型生成 → 返回答案
```

### 实现步骤

#### 1. 文档加载与切分

```java
@Service
public class DocumentService {
    
    @Autowired
    private DocumentReader documentReader;
    
    public List<Document> loadAndSplitDocuments(Resource resource) {
        // 加载文档
        List<Document> documents = documentReader.get();
        
        // 文档切分（按段落或语义切分）
        TextSplitter splitter = new TokenTextSplitter(
            500,   // 每个chunk最多500个token
            100    // 相邻chunk重叠100个token
        );
        
        return splitter.split(documents);
    }
}
```

#### 2. 向量化与存储

```java
@Service
public class VectorStoreService {
    
    @Autowired
    private EmbeddingModel embeddingModel;
    
    @Autowired
    private VectorStore vectorStore;
    
    public void indexDocuments(List<Document> documents) {
        // 将文档向量化并存储到向量数据库
        vectorStore.add(documents);
    }
}
```

支持的向量数据库：
- **PGVector**：基于 PostgreSQL 的向量扩展
- **Milvus**：专业的向量数据库
- **Chroma**：轻量级向量数据库
- **SimpleVectorStore**：内存存储，适合开发测试

#### 3. 检索与生成

```java
@Service
public class RagService {
    
    @Autowired
    private ChatClient chatClient;
    
    @Autowired
    private VectorStore vectorStore;
    
    public String query(String question) {
        // 1. 检索相关文档
        List<Document> similarDocs = vectorStore.similaritySearch(
            SearchRequest.query(question).withTopK(3)
        );
        
        // 2. 构造上下文
        String context = similarDocs.stream()
            .map(Document::getContent)
            .collect(Collectors.joining("\n\n"));
        
        // 3. 生成答案
        String prompt = """
            请基于以下知识库内容回答用户问题：
            
            知识库内容：
            %s
            
            用户问题：%s
            
            回答要求：
            1. 仅根据知识库内容回答
            2. 如果知识库中没有相关信息，明确告知用户
            3. 回答要准确、简洁
            """.formatted(context, question);
        
        return chatClient.prompt()
            .user(prompt)
            .call()
            .content();
    }
}
```

### 完整配置

```java
@Configuration
public class RagConfig {
    
    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel, DataSource dataSource) {
        // 使用 PGVector
        return new PgVectorStore.Builder(dataSource, embeddingModel)
            .withSchemaName("vector_store")
            .withTableName("documents")
            .withDimensions(1536)  // OpenAI embedding 维度
            .build();
    }
    
    @Bean
    public EmbeddingModel embeddingModel(OpenAiApi openAiApi) {
        return new OpenAiEmbeddingModel(openAiApi);
    }
}
```

### 优化技巧

1. **文档切分策略**
   - 重叠切分：避免语义在边界处断裂
   - 语义切分：按段落或句子切分，保持语义完整性

2. **检索优化**
   - 混合检索：结合向量检索和关键词检索
   - 重排序：对召回结果进行二次排序
   - 元数据过滤：添加业务属性过滤

3. **提示词工程**
   - 明确角色和任务
   - 限制回答范围
   - 提供示例

---

## Function Calling 实现

### 应用场景

静态知识库无法满足的需求：
- 实时数据查询（账户余额、订单状态）
- 个性化计算（额度测算、利息计算）
- 业务操作（提交申请、修改信息）

### 实现原理

```
用户提问 → 大模型判断需要调用函数 → 返回函数名和参数 → 执行函数 → 将结果返回给大模型 → 生成自然语言回答
```

### 代码实现

#### 1. 定义函数

```java
@Component
public class BusinessFunctions {
    
    @Autowired
    private AccountService accountService;
    
    @Autowired
    private LoanService loanService;
    
    // 查询账户余额
    @Bean
    @Description("查询用户账户余额")
    public Function<BalanceRequest, BalanceResponse> queryBalance() {
        return request -> {
            BigDecimal balance = accountService.getBalance(request.userId());
            return new BalanceResponse(balance);
        };
    }
    
    // 计算贷款额度
    @Bean
    @Description("根据用户信息计算可贷款额度")
    public Function<LoanCalculateRequest, LoanCalculateResponse> calculateLoanAmount() {
        return request -> {
            BigDecimal amount = loanService.calculateMaxAmount(
                request.income(),
                request.creditScore()
            );
            return new LoanCalculateResponse(amount);
        };
    }
}

// 请求参数
record BalanceRequest(
    @JsonProperty(required = true)
    @JsonPropertyDescription("用户ID")
    String userId
) {}

record BalanceResponse(BigDecimal balance) {}

record LoanCalculateRequest(
    @JsonPropertyDescription("月收入")
    BigDecimal income,
    
    @JsonPropertyDescription("信用分数")
    Integer creditScore
) {}

record LoanCalculateResponse(BigDecimal maxAmount) {}
```

#### 2. 注册函数

```java
@Configuration
public class FunctionConfig {
    
    @Bean
    public FunctionCallbackContext functionCallbackContext(ApplicationContext context) {
        FunctionCallbackContext callbackContext = new FunctionCallbackContext();
        
        // 自动注册所有标注了 @Bean 和 @Description 的函数
        context.getBeansWithAnnotation(Description.class)
            .forEach((name, bean) -> {
                if (bean instanceof Function) {
                    callbackContext.registerFunction(name, (Function<?, ?>) bean);
                }
            });
        
        return callbackContext;
    }
}
```

#### 3. 使用函数

```java
@Service
public class FunctionCallingService {
    
    @Autowired
    private ChatClient chatClient;
    
    public String chat(String message) {
        return chatClient.prompt()
            .user(message)
            .functions("queryBalance", "calculateLoanAmount")  // 指定可用函数
            .call()
            .content();
    }
}
```

### 完整示例

```java
@RestController
@RequestMapping("/api/assistant")
public class AssistantController {
    
    @Autowired
    private FunctionCallingService functionCallingService;
    
    @PostMapping("/query")
    public String query(@RequestBody String question) {
        // 用户问："我的账户还有多少钱？"
        // 大模型自动调用 queryBalance 函数
        // 返回："您的账户余额为 1,234.56 元"
        
        return functionCallingService.chat(question);
    }
}
```

### 安全考虑

1. **权限校验**
```java
public Function<BalanceRequest, BalanceResponse> queryBalance() {
    return request -> {
        // 校验用户权限
        if (!authService.hasPermission(request.userId())) {
            throw new UnauthorizedException("无权查询该用户信息");
        }
        
        BigDecimal balance = accountService.getBalance(request.userId());
        return new BalanceResponse(balance);
    };
}
```

2. **参数验证**
```java
record LoanCalculateRequest(
    @JsonPropertyDescription("月收入")
    @Min(0)
    BigDecimal income,
    
    @JsonPropertyDescription("信用分数")
    @Min(300) @Max(850)
    Integer creditScore
) {}
```

3. **敏感操作确认**
```java
@Bean
@Description("提交贷款申请")
public Function<LoanApplicationRequest, LoanApplicationResponse> submitLoanApplication() {
    return request -> {
        // 敏感操作，需要用户二次确认
        if (!request.confirmed()) {
            return new LoanApplicationResponse(
                false, 
                "此操作将提交贷款申请，请确认是否继续"
            );
        }
        
        // 执行申请
        String applicationId = loanService.submitApplication(request);
        return new LoanApplicationResponse(true, "申请已提交，申请编号：" + applicationId);
    };
}
```

---

## 项目集成示例

### Maven 依赖

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0-M1</version>
</dependency>

<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-pgvector-store-spring-boot-starter</artifactId>
    <version>1.0.0-M1</version>
</dependency>
```

### 配置文件

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}
      chat:
        options:
          model: gpt-4
          temperature: 0.7
      embedding:
        options:
          model: text-embedding-ada-002
    
    vectorstore:
      pgvector:
        schema-name: vector_store
        table-name: documents
        dimensions: 1536
```

### 综合应用

```java
@Service
public class IntelligentCustomerService {
    
    @Autowired
    private ChatClient chatClient;
    
    @Autowired
    private VectorStore vectorStore;
    
    @Autowired
    private ChatMemory chatMemory;
    
    /**
     * 智能客服主入口
     * 集成：多轮对话 + RAG + Function Calling
     */
    public String handleCustomerQuery(String conversationId, String userId, String question) {
        // 1. RAG 检索相关知识
        List<Document> docs = vectorStore.similaritySearch(
            SearchRequest.query(question).withTopK(3)
        );
        
        String context = docs.stream()
            .map(Document::getContent)
            .collect(Collectors.joining("\n\n"));
        
        // 2. 构造系统提示词
        String systemPrompt = """
            你是一个专业的客服助手。
            
            知识库内容：
            %s
            
            工作规则：
            1. 优先使用知识库内容回答
            2. 需要实时数据时调用相应的函数
            3. 保持专业、礼貌的服务态度
            4. 不确定时建议用户联系人工客服
            """.formatted(context);
        
        // 3. 调用大模型（自动管理对话历史、调用函数）
        return chatClient.prompt()
            .system(systemPrompt)
            .user(question)
            .advisors(a -> a
                .param(MessageChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY, conversationId)
                .param("userId", userId))
            .functions("queryBalance", "calculateLoanAmount", "queryLoanStatus")
            .call()
            .content();
    }
}
```

---

## 最佳实践

### 1. 模型选择

- **Chat 模型**：GPT-4（推理能力强）或 GPT-3.5（成本低）
- **Embedding 模型**：text-embedding-ada-002（平衡）或本地模型
- **本地部署**：Ollama + Llama 3（数据安全）

### 2. Token 优化

- 使用滑动窗口限制对话历史
- 压缩系统提示词
- 流式输出减少等待时间

### 3. 性能优化

- 向量检索添加缓存
- 批量处理文档嵌入
- 异步调用大模型

### 4. 监控告警

```java
@Component
@Aspect
public class AiMetricsAspect {
    
    @Around("@annotation(org.springframework.ai.chat.ChatClient)")
    public Object recordMetrics(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        
        try {
            Object result = pjp.proceed();
            long duration = System.currentTimeMillis() - start;
            
            // 记录调用时长
            meterRegistry.timer("ai.chat.duration").record(duration, TimeUnit.MILLISECONDS);
            
            return result;
        } catch (Exception e) {
            // 记录错误
            meterRegistry.counter("ai.chat.error").increment();
            throw e;
        }
    }
}
```

---

## 总结

Spring AI 为 Java 开发者提供了完整的 AI 应用开发工具链：

- **多轮对话**：通过 ChatMemory 管理上下文
- **RAG 知识库**：结合检索与生成，提升准确性
- **Function Calling**：连接实时业务数据
- **统一抽象**：屏蔽不同模型的差异

在实际项目中，可以根据业务需求灵活组合这些能力，构建智能化的应用系统。
