// node debug-api.js 执行此命令来测试api
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

async function testAPI() {
  console.log('开始API测试...');
  
  // 1. 测试数据库连接
  console.log('\n1. 测试数据库连接...');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查是否有聊天记录
    const chats = await prisma.chat.findMany({ take: 1 });
    console.log(`✅ 数据库中有 ${chats.length} 个聊天记录`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return;
  }

  // 2. 测试OpenAI API
  console.log('\n2. 测试OpenAI API...');
  const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  });

  try {
    const response = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 10,
    });
    console.log('✅ OpenAI API 连接成功');
    console.log('响应:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API 连接失败:', error.message);
    console.error('错误详情:', error);
  }

  // 3. 测试流式API
  console.log('\n3. 测试流式API...');
  try {
    const streamResponse = await openai.chat.completions.create({
      model: "qwen-plus",
      messages: [{ role: "user", content: "Hello" }],
      stream: true,
      max_tokens: 50,
    });

    console.log('✅ 流式API 连接成功');
    
    // 读取流式响应
    for await (const chunk of streamResponse) {
      if (chunk.choices[0]?.delta?.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    }
    console.log('\n✅ 流式响应读取完成');
  } catch (error) {
    console.error('❌ 流式API 连接失败:', error.message);
  }

  await prisma.$disconnect();
  console.log('\n测试完成');
}

// 加载环境变量
require('dotenv').config();
testAPI().catch(console.error); 