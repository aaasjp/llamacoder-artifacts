# 从Together AI迁移到阿里云DashScope

本文档总结了将LlamaCoder项目从Together AI迁移到阿里云DashScope的修改。

## 主要修改

### 1. 依赖更新
- 移除了 `together-ai` 依赖
- 添加了 `openai` 依赖 (v4.0.0)

### 2. 环境变量
- 将 `TOGETHER_API_KEY` 替换为 `DASHSCOPE_API_KEY`

### 3. API调用修改

#### actions.ts
- 将 `Together` 导入替换为 `OpenAI`
- 更新API配置：
  ```typescript
  const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  });
  ```
- 更新模型名称：
  - `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` → `Moonshot-Kimi-K2-Instruct`
  - `meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo` → `qwen-vl-max`
  - `Qwen/Qwen2.5-Coder-32B-Instruct` → `qwen3-coder-plus`

#### API路由 (get-next-completion-stream-promise/route.ts)
- 将Together AI的流式调用替换为OpenAI兼容的调用
- 移除了Helicone相关的配置

#### 客户端流式处理 (page.client.tsx)
- 移除了 `ChatCompletionStream` 导入
- 创建了自定义的流式处理函数 `processStream`
- 实现了与OpenAI兼容的SSE (Server-Sent Events) 解析

### 4. 模型配置更新 (constants.ts)
- 更新了模型列表，使用阿里云DashScope支持的模型：
  - `moonshotai/Moonshot-Kimi-K2-Instruct`
  - `Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8`
  - `deepseek-ai/DeepSeek-V3`
  - `Qwen/Qwen2.5-Coder-32B-Instruct`

### 5. 文档更新
- 更新了README.md，说明使用阿里云DashScope
- 更新了.example.env文件

## 支持的模型

阿里云DashScope支持以下主要模型：

1. **Moonshot-Moonshot-Kimi-K2-Instruct** - 通用对话模型
2. **Qwen3-Coder-480B-A35B-Instruct-FP8** - 代码生成模型
3. **DeepSeek-V3** - 代码生成模型
4. **Qwen2.5-Coder-32B-Instruct** - 代码生成模型

## 使用方法

1. 获取阿里云DashScope API密钥
2. 在 `.env` 文件中设置 `DASHSCOPE_API_KEY`
3. 运行 `npm install` 安装新依赖
4. 运行 `npm run dev` 启动开发服务器

## 注意事项

- 阿里云DashScope使用OpenAI兼容的API格式
- 流式输出使用标准的SSE格式
- 所有模型调用都通过 `https://dashscope.aliyuncs.com/compatible-mode/v1` 端点

## 示例文件

- `aliyuncs_llm_example.ts` - 非流式调用示例
- `aliyuncs_llm_stream_example.ts` - 流式调用示例 