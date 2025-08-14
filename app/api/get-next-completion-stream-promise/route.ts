import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import OpenAI from "openai";
import { AzureOpenAI } from "openai";

export async function POST(req: Request) {
  const prisma = new PrismaClient();
  const { messageId, model } = await req.json();

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return new Response(null, { status: 404 });
  }

  const messagesRes = await prisma.message.findMany({
    where: { chatId: message.chatId, position: { lte: message.position } },
    orderBy: { position: "asc" },
  });

  let messages = z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .parse(messagesRes);

  if (messages.length > 10) {
    messages = [messages[0], messages[1], messages[2], ...messages.slice(-7)];
  }

  // 按照Azure OpenAI的方式配置API客户端
  let client;
  if (model === "gpt-4o") {
    // 使用Azure OpenAI
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = process.env.OPENAI_API_VERSION;
    client = new AzureOpenAI({ endpoint, apiKey, apiVersion });
  } else {
    // 使用阿里云DashScope API
    client = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });
  }

  console.log("route.ts messages:", messages.map((m) => ({ role: m.role, content: m.content })));
  console.log("route.ts model:", model);
  
  const res = await client.chat.completions.create({
    model: model === "gpt-4o" ? process.env.AZURE_OPENAI_DEPLOYMENT_NAME : model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
    temperature: 0.2,
    max_tokens: 8192,
  });

  // console.log("OpenAI API response:", res);

  // 根据阿里云DashScope官方示例创建流式响应
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log("开始处理流式响应...");
        let chunkCount = 0;
        
        for await (const chunk of res) {
          chunkCount++;
          // console.log(`处理第 ${chunkCount} 个数据块:`, chunk);
          
          // 检查是否有usage信息
          if (!chunk.choices?.length) {
            console.log('Usage:', chunk.usage);
            continue;
          }
          
          const delta = chunk.choices[0].delta;
          
          // 处理正式回复内容
          if (delta.content) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            // console.log("发送内容:", delta.content);
            controller.enqueue(encoder.encode(data));
          }
        }
        
        console.log(`流式响应处理完成，总共处理了 ${chunkCount} 个数据块`);
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error("流式响应处理错误:", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export const maxDuration = 45;
