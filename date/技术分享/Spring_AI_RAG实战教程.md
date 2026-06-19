# Spring AI + RAG 知识库实战教程

## 📚 教程概述

本教程将手把手教你在信贷平台项目中集成Spring AI，实现基于RAG（Retrieval-Augmented Generation）的智能客服功能。

**学习目标：**
- 理解RAG的工作原理
- 掌握Spring AI的核心概念
- 实现向量数据库存储
- 构建智能问答系统
- 集成到现有项目中

---

## 🎯 第一步：理解RAG架构

### 什么是RAG？

RAG = Retrieval（检索） + Augmented（增强） + Generation（生成）

**工作流程：**
```
用户问题 → 向量化 → 检索相似文档 → 构建提示词 → LLM生成答案
```

**核心组件：**
1. **文档处理器**：将知识文档切分成chunks
2. **向量数据库**：存储文档的向量表示
3. **检索器**：根据问题检索相关文档
4. **LLM**：基于检索结果生成答案

---

## 🛠️ 第二步：环境准备

### 2.1 添加Maven依赖

在 `ruoyi-modules/ruoyi-system/pom.xml` 中添加：

```xml
<!-- Spring AI 核心 -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
    <version>1.0.0-M1</version>
</dependency>

<!-- 向量存储 - PGVector (推荐) -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-pgvector-store-spring-boot-starter</artifactId>
    <version>1.0.0-M1</version>
</dependency>

<!-- 或者使用Redis Vector -->
<!--
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-redis-store</artifactId>
    <version>1.0.0-M1</version>
</dependency>
-->

<!-- 文档处理 -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-pdf-document-reader</artifactId>
    <version>1.0.0-M1</version>
</dependency>

<!-- Embedding模型 -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-transformers-spring-boot-starter</artifactId>
    <version>1.0.0-M1</version>
</dependency>
```

### 2.2 配置文件设置

在 `application.yml` 中添加配置：

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY:your-api-key}
      base-url: https://api.openai.com  # 或使用代理地址
      chat:
        options:
          model: gpt-4o-mini
          temperature: 0.7
      embedding:
        options:
          model: text-embedding-3-small
    
    vectorstore:
      pgvector:
        # 使用现有PostgreSQL数据库
        index-type: HNSW
        distance-type: COSINE_DISTANCE
        dimensions: 1536  # text-embedding-3-small的维度
```

### 2.3 数据库准备（使用PGVector）

在PostgreSQL中启用向量扩展：

```sql
-- 启用pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建向量存储表（Spring AI会自动创建，这里仅供参考）
CREATE TABLE IF NOT EXISTS vector_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536)  -- 维度要匹配embedding模型
);

-- 创建索引加速检索
CREATE INDEX ON vector_store USING hnsw (embedding vector_cosine_ops);
```

---

## 📖 第三步：文档处理与向量化

### 3.1 创建文档服务

创建 `KnowledgeBaseService.java`：

```java
package org.dromara.system.service.ai;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {
    
    private final VectorStore vectorStore;
    
    /**
     * 导入PDF文档到知识库
     */
    public void importPdfDocument(Resource pdfResource, Map<String, Object> metadata) {
        // 1. 读取PDF
        PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(pdfResource);
        List<Document> documents = pdfReader.get();
        
        // 2. 文档切分（每个chunk约500 tokens）
        TokenTextSplitter splitter = new TokenTextSplitter(500, 100);  // chunkSize, overlap
        List<Document> chunks = splitter.apply(documents);
        
        // 3. 添加元数据
        chunks.forEach(chunk -> {
            chunk.getMetadata().putAll(metadata);
        });
        
        // 4. 向量化并存储
        vectorStore.add(chunks);
        
        log.info("成功导入文档，共{}个chunks", chunks.size());
    }
    
    /**
     * 导入文本内容到知识库
     */
    public void importTextContent(String content, Map<String, Object> metadata) {
        Document document = new Document(content, metadata);
        
        // 文档切分
        TokenTextSplitter splitter = new TokenTextSplitter(500, 100);
        List<Document> chunks = splitter.apply(List.of(document));
        
        // 向量化并存储
        vectorStore.add(chunks);
        
        log.info("成功导入文本，共{}个chunks", chunks.size());
    }
    
    /**
     * 批量导入常见问题
     */
    public void importFAQs(List<FAQ> faqs) {
        List<Document> documents = faqs.stream()
            .map(faq -> new Document(
                "问题：" + faq.getQuestion() + "\n答案：" + faq.getAnswer(),
                Map.of(
                    "type", "faq",
                    "category", faq.getCategory(),
                    "question", faq.getQuestion()
                )
            ))
            .toList();
        
        vectorStore.add(documents);
        log.info("成功导入{}条FAQ", faqs.size());
    }
    
    // FAQ内部类
    public record FAQ(String question, String answer, String category) {}
}
```

---

## 🤖 第四步：实现RAG问答服务

### 4.1 创建AI客服服务

创建 `AiCustomerService.java`：

```java
package org.dromara.system.service.ai;

import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.ChatResponse;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCustomerService {
    
    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    
    // 系统提示词模板
    private static final String SYSTEM_PROMPT = """
        你是一个专业的信贷平台智能客服助手。
        
        请基于以下知识库内容回答用户问题：
        {context}
        
        回答要求：
        1. 只基于提供的知识库内容回答
        2. 如果知识库中没有相关信息，礼貌地告知用户
        3. 回答要准确、简洁、友好
        4. 涉及金额、利率等数字要特别准确
        5. 如果用户问题不清楚，可以引导用户补充信息
        """;
    
    /**
     * RAG问答
     */
    public String chat(String userQuestion) {
        // 1. 检索相关文档（Top 5）
        List<Document> similarDocuments = vectorStore.similaritySearch(
            SearchRequest.query(userQuestion).withTopK(5)
        );
        
        // 2. 构建上下文
        String context = similarDocuments.stream()
            .map(Document::getContent)
            .collect(Collectors.joining("\n\n---\n\n"));
        
        log.info("检索到{}条相关文档", similarDocuments.size());
        
        // 3. 构建提示词
        Message systemMessage = new SystemPromptTemplate(SYSTEM_PROMPT)
            .createMessage(Map.of("context", context));
        Message userMessage = new UserMessage(userQuestion);
        
        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));
        
        // 4. 调用LLM生成答案
        ChatResponse response = chatClient.call(prompt);
        
        return response.getResult().getOutput().getContent();
    }
    
    /**
     * 流式问答（支持实时返回）
     */
    public void chatStream(String userQuestion, StreamCallback callback) {
        // 检索相关文档
        List<Document> similarDocuments = vectorStore.similaritySearch(
            SearchRequest.query(userQuestion).withTopK(5)
        );
        
        String context = similarDocuments.stream()
            .map(Document::getContent)
            .collect(Collectors.joining("\n\n---\n\n"));
        
        // 构建提示词
        Message systemMessage = new SystemPromptTemplate(SYSTEM_PROMPT)
            .createMessage(Map.of("context", context));
        Message userMessage = new UserMessage(userQuestion);
        
        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));
        
        // 流式调用
        chatClient.stream(prompt).subscribe(
            chatResponse -> {
                String content = chatResponse.getResult().getOutput().getContent();
                callback.onChunk(content);
            },
            error -> callback.onError(error),
            () -> callback.onComplete()
        );
    }
    
    // 回调接口
    public interface StreamCallback {
        void onChunk(String chunk);
        void onError(Throwable error);
        void onComplete();
    }
}
```

---

## 🎮 第五步：创建Controller接口

### 5.1 AI客服Controller

创建 `AiCustomerController.java`：

```java
package org.dromara.system.controller.ai;

import org.dromara.common.core.domain.R;
import org.dromara.common.web.core.BaseController;
import org.dromara.system.service.ai.AiCustomerService;
import org.dromara.system.service.ai.KnowledgeBaseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Tag(name = "AI客服", description = "AI智能客服接口")
@RestController
@RequestMapping("/ai/customer")
@RequiredArgsConstructor
public class AiCustomerController extends BaseController {
    
    private final AiCustomerService aiCustomerService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    
    @Operation(summary = "AI问答")
    @PostMapping("/chat")
    public R<String> chat(@RequestBody Map<String, String> request) {
        String question = request.get("question");
        String answer = aiCustomerService.chat(question);
        return R.ok(answer);
    }
    
    @Operation(summary = "流式AI问答（SSE）")
    @GetMapping("/chat/stream")
    public SseEmitter chatStream(@RequestParam String question) {
        SseEmitter emitter = new SseEmitter(60000L);
        
        executor.execute(() -> {
            try {
                aiCustomerService.chatStream(question, new AiCustomerService.StreamCallback() {
                    @Override
                    public void onChunk(String chunk) {
                        try {
                            emitter.send(SseEmitter.event().data(chunk));
                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }
                    
                    @Override
                    public void onError(Throwable error) {
                        emitter.completeWithError(error);
                    }
                    
                    @Override
                    public void onComplete() {
                        emitter.complete();
                    }
                });
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }
    
    @Operation(summary = "上传知识库文档")
    @PostMapping("/knowledge/upload")
    public R<Void> uploadKnowledge(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "category", defaultValue = "general") String category
    ) {
        try {
            Map<String, Object> metadata = Map.of(
                "filename", file.getOriginalFilename(),
                "category", category,
                "uploadTime", System.currentTimeMillis()
            );
            
            if (file.getOriginalFilename().endsWith(".pdf")) {
                knowledgeBaseService.importPdfDocument(file.getResource(), metadata);
            } else {
                String content = new String(file.getBytes());
                knowledgeBaseService.importTextContent(content, metadata);
            }
            
            return R.ok();
        } catch (Exception e) {
            return R.fail("上传失败：" + e.getMessage());
        }
    }
}
```

---

## 📝 第六步：初始化知识库

### 6.1 创建知识库初始化脚本

创建 `KnowledgeBaseInitializer.java`：

```java
package org.dromara.system.config;

import org.dromara.system.service.ai.KnowledgeBaseService;
import org.dromara.system.service.ai.KnowledgeBaseService.FAQ;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class KnowledgeBaseInitializer implements CommandLineRunner {
    
    private final KnowledgeBaseService knowledgeBaseService;
    
    @Override
    public void run(String... args) {
        log.info("开始初始化知识库...");
        
        // 导入常见问题
        List<FAQ> faqs = List.of(
            new FAQ(
                "如何申请贷款？",
                "您可以在首页点击"立即申请"，填写个人信息和贷款金额，提交后我们会在1个工作日内审核。",
                "贷款申请"
            ),
            new FAQ(
                "贷款利率是多少？",
                "我们的贷款利率根据产品不同有所差异，一般在年化5%-12%之间，具体以产品详情页为准。",
                "利率相关"
            ),
            new FAQ(
                "审核需要多久？",
                "一般情况下，我们会在提交后1个工作日内完成审核，审核通过后资金会在24小时内到账。",
                "审核流程"
            ),
            new FAQ(
                "需要提供什么资料？",
                "您需要提供：1. 身份证正反面照片 2. 银行卡信息 3. 手机号验证 4. 个人征信授权",
                "申请资料"
            ),
            new FAQ(
                "如何还款？",
                "我们支持自动扣款和主动还款两种方式。您可以在"我的订单"中查看还款计划并操作还款。",
                "还款相关"
            ),
            new FAQ(
                "逾期会怎样？",
                "逾期会产生罚息（日利率0.05%），并影响您的个人征信记录。请务必按时还款。",
                "逾期处理"
            ),
            new FAQ(
                "可以提前还款吗？",
                "可以的，我们支持提前还款且不收取违约金。提前还款后利息按实际使用天数计算。",
                "还款相关"
            ),
            new FAQ(
                "如何联系客服？",
                "您可以通过以下方式联系我们：1. 在线客服（工作时间9:00-21:00）2. 客服电话：400-xxx-xxxx",
                "客服服务"
            )
        );
        
        knowledgeBaseService.importFAQs(faqs);
        
        // 导入产品说明
        String productInfo = """
            ## 产品介绍
            
            ### 信用贷产品
            - 额度：1万-50万
            - 期限：3/6/12/24个月
            - 利率：年化5.8%-8.9%
            - 特点：无需抵押，纯信用贷款
            
            ### 消费贷产品
            - 额度：5千-20万
            - 期限：3/6/12个月
            - 利率：年化6.8%-10.9%
            - 特点：快速审批，当天到账
            
            ### 小微贷产品
            - 额度：10万-500万
            - 期限：12/24/36个月
            - 利率：年化5.5%-7.9%
            - 特点：专为小微企业主设计
            """;
        
        knowledgeBaseService.importTextContent(
            productInfo,
            Map.of("type", "product", "category", "产品介绍")
        );
        
        log.info("知识库初始化完成！");
    }
}
```

---

## 🎨 第七步：前端集成（我来实现）

### 7.1 创建AI客服组件

我会创建一个完整的微信小程序AI客服界面，包括：

1. **浮动客服按钮** - 全局悬浮的客服入口
2. **对话界面** - 仿微信风格的聊天界面
3. **流式输出** - 支持AI逐字返回
4. **历史记录** - 本地保存对话历史
5. **快捷问题** - 常见问题快速点击

### 7.2 前端技术栈

- 微信小程序原生开发
- SSE（Server-Sent Events）实现流式输出
- 本地存储管理对话历史

---

## 🚀 第八步：测试与优化

### 8.1 测试清单

- [ ] 向量数据库连接测试
- [ ] 文档导入功能测试
- [ ] RAG检索准确性测试
- [ ] LLM回答质量测试
- [ ] 流式输出性能测试
- [ ] 前端交互体验测试

### 8.2 性能优化建议

1. **向量检索优化**
   - 调整Top-K参数（建议3-7）
   - 优化chunk大小（300-700 tokens）
   - 使用HNSW索引加速检索

2. **提示词优化**
   - 精简系统提示词
   - 添加few-shot示例
   - 明确回答格式要求

3. **缓存策略**
   - 对常见问题进行缓存
   - 使用Redis缓存LLM响应
   - 实现对话上下文管理

---

## 📚 附录：核心概念详解

### A. Embedding（向量化）

将文本转换为高维向量（如1536维），语义相似的文本在向量空间中距离更近。

```
"如何申请贷款" → [0.23, -0.45, 0.67, ..., 0.12]  (1536维)
"怎样贷款"     → [0.25, -0.43, 0.69, ..., 0.14]  (相似！)
```

### B. 相似度计算

常用方法：
- **余弦相似度**（Cosine Similarity）- 推荐
- 欧氏距离（Euclidean Distance）
- 点积（Dot Product）

### C. Chunk切分策略

| 策略 | Chunk大小 | Overlap | 适用场景 |
|------|----------|---------|----------|
| 小切分 | 200-300 tokens | 20-50 | FAQ、短文档 |
| 中切分 | 500-700 tokens | 50-100 | 常规文档 |
| 大切分 | 1000+ tokens | 100-200 | 长文档、需要完整上下文 |

---

## 🔗 相关资源

- [Spring AI官方文档](https://docs.spring.io/spring-ai/reference/)
- [OpenAI API文档](https://platform.openai.com/docs)
- [PGVector文档](https://github.com/pgvector/pgvector)

---

## ❓ 常见问题

**Q: 如何选择Embedding模型？**
- text-embedding-3-small (1536维) - 性价比高，推荐
- text-embedding-3-large (3072维) - 更准确，成本更高

**Q: 向量数据库如何选择？**
- PGVector - 适合已有PostgreSQL
- Redis Vector - 适合需要高性能缓存
- Milvus - 适合大规模向量检索

**Q: 如何评估RAG效果？**
- 准确率：检索到的文档是否相关
- 召回率：相关文档是否都被检索到
- 回答质量：人工评估或使用LLM评分

---

## 📖 下一步学习

1. ✅ 完成基础RAG实现
2. 🔄 添加对话历史管理
3. 🔄 实现多轮对话上下文
4. 🔄 集成语音输入/输出
5. 🔄 添加意图识别和路由

---

**教程完成！开始你的Spring AI之旅吧！** 🎉
