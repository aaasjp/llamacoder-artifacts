// 阿里dashscope调用大模型示例代码
// 流式输出
// 模型有Moonshot-Moonshot-Kimi-K2-Instruct,qwen3-coder-plus,deepseek-v3
// 下面是Moonshot-Kimi-K2-Instruct为例，可按需更换模型名称。
import OpenAI from "openai";
import process from 'process';

// 初始化 openai 客户端
const openai = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY, // 从环境变量读取
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

let answerContent = '';

async function main() {
    try {
        const stream = await openai.chat.completions.create({
            model: 'Moonshot-Kimi-K2-Instruct',
            messages: [{ role: 'user', content: '9.9和9.11谁大' }],
            stream: true
        });

        for await (const chunk of stream) {
            if (!chunk.choices?.length) {
                console.log('\nUsage:');
                console.log(chunk.usage);
                continue;
            }
            const delta = chunk.choices[0].delta;
            // 处理正式回复
            if (delta.content) {
                process.stdout.write(delta.content);
                answerContent += delta.content;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
main();