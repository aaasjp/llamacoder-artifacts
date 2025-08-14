"use server";

import { getPrisma } from "@/lib/prisma";

import {
  getMainCodingPrompt,
  screenshotToCodePrompt,
  softwareArchitectPrompt,
} from "@/lib/prompts";
import { notFound } from "next/navigation";
import OpenAI from "openai";

export async function createChat(
  prompt: string,
  model: string,
  quality: "high" | "low",
  screenshotUrl: string | undefined,
) {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL环境变量未设置");
    }
    
    if (!process.env.DASHSCOPE_API_KEY) {
      throw new Error("DASHSCOPE_API_KEY环境变量未设置");
    }

    console.log("创建聊天:", "prompt:", prompt, "model:", model, "quality:", quality, "screenshotUrl:", screenshotUrl);
    
    const prisma = getPrisma();
  
    const chat = await prisma.chat.create({
      data: {
        model,
        quality,
        prompt,
        title: "",
        shadcn: true,
      },
    });

    const openai = new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });

    async function fetchTitle() {
      try {
        const responseForChatTitle = await openai.chat.completions.create({
          model: "Moonshot-Kimi-K2-Instruct",
          // model: model,
          messages: [
            {
              role: "system",
              content:
                "您是一个帮助用户创建简单应用或脚本的聊天机器人，您当前的任务是为聊天创建一个简洁的标题，最多6个词，基于他们的初始提示。请只返回标题。",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });
        const title = responseForChatTitle.choices[0].message?.content || prompt;
        return title;
      } catch (error) {
        console.log("标题获取失败:", error);
        return prompt;
      }
    }

    async function fetchTopExample() {
      return "none";
      /*
      try {
        const findSimilarExamples = await openai.chat.completions.create({
          model: "Moonshot-Kimi-K2-Instruct",
          // model: model,
          messages: [
            {
              role: "system",
              content: `您是一个有用的机器人。给定一个构建应用的请求，您将其与提供的最相似示例进行匹配。如果请求与任何提供的示例都不相似，请返回"none"。以下是示例列表，只回复其中一个或"none"：

              - landing page
              - blog app
              - quiz app
              - pomodoro timer
              `,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const mostSimilarExample =
          findSimilarExamples.choices[0].message?.content || "none";
        return mostSimilarExample;
      } catch (error) {
        return "none";
      }
      */
    }

    const [title, mostSimilarExample] = await Promise.all([
      fetchTitle(),
      fetchTopExample(),
    ]);
    console.log("标题:", title);
    console.log("最相似示例:", mostSimilarExample);

    let fullScreenshotDescription;
    if (screenshotUrl) {
      try {
        const screenshotResponse = await openai.chat.completions.create({
          // 这个因为是多模态，所以不能用model，只能用qwen-vl-max
          model: "qwen-vl-max",
          temperature: 0.2,
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: screenshotToCodePrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: screenshotUrl,
                  },
                },
              ],
            },
          ],
        });

        fullScreenshotDescription = screenshotResponse.choices[0].message?.content;
        console.log("截图描述:", fullScreenshotDescription);
      } catch (error) {
        fullScreenshotDescription = undefined;
        console.log("截图描述获取失败:", error);
      }
    }

    let userMessage: string;
    if (quality === "high") {
      try {
        let initialRes = await openai.chat.completions.create({
          model: "Moonshot-Kimi-K2-Instruct",
          // model: model,
          messages: [
            {
              role: "system",
              content: softwareArchitectPrompt,
            },
            {
              role: "user",
              content: fullScreenshotDescription
                ? fullScreenshotDescription + prompt
                : prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        });

        userMessage = initialRes.choices[0].message?.content ?? prompt;
        console.log("根据用户指令的规划结果:", userMessage);
      } catch (error) {
        console.log("根据用户指令的规划结果获取失败:", error);
        userMessage = prompt;
      }
    } else if (fullScreenshotDescription) {
      userMessage =
        prompt +
        "尽可能接近地重新创建此应用：" +
        fullScreenshotDescription;
    } else {
      userMessage = prompt;
    }

    let newChat = await prisma.chat.update({
      where: {
        id: chat.id,
      },
      data: {
        title,
        messages: {
          createMany: {
            data: [
              {
                role: "system",
                content: getMainCodingPrompt(mostSimilarExample),
                position: 0,
              },
              { role: "user", content: userMessage, position: 1 },
            ],
          },
        },
      },
      include: {
        messages: true,
      },
    });

    const lastMessage = newChat.messages
      .sort((a, b) => a.position - b.position)
      .at(-1);
    if (!lastMessage) throw new Error("没有新消息");

    return {
      chatId: chat.id,
      lastMessageId: lastMessage.id,
    };
  } catch (error) {
    throw error;
  }
}

export async function createMessage(
  chatId: string,
  text: string,
  role: "assistant" | "user",
) {
  try {
    const prisma = getPrisma();
    
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: true },
    });
    if (!chat) {
      notFound();
    }

    const maxPosition = Math.max(...chat.messages.map((m) => m.position));

    const newMessage = await prisma.message.create({
      data: {
        role,
        content: text,
        position: maxPosition + 1,
        chatId,
      },
    });

    return newMessage;
  } catch (error) {
    throw error;
  }
}
