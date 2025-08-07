// 阿里dashscope调用大模型示例代码
// 非流式输出
// 模型有Moonshot-Moonshot-Kimi-K2-Instruct,qwen3-coder-plus,deepseek-v3
// 下面是以qwen3-coder-plus为例，可按需更换模型名称。
import OpenAI from "openai";

const openai = new OpenAI(
    {
        // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    }
);

async function main() {
    const completion = await openai.chat.completions.create({
        model: "qwen3-coder-plus",  //此处以qwen3-coder-plus为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "你是谁？" }
        ],
    });
    console.log(JSON.stringify(completion))
}

main();

