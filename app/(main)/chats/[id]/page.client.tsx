"use client";

import { createMessage } from "@/app/(main)/actions";
import LogoSmall from "@/components/icons/logo-small";
import { splitByFirstCodeFence } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, use, useEffect, useRef, useState } from "react";
import ChatBox from "./chat-box";
import ChatLog from "./chat-log";
import CodeViewer from "./code-viewer";
import CodeViewerLayout from "./code-viewer-layout";
import type { Chat } from "./page";
import { Context } from "../../providers";

// 自定义流式处理函数
async function processStream(stream: ReadableStream, callbacks: {
  onContent: (delta: string, content: string) => void;
  onFinalContent: (finalText: string) => void;
}) {
  console.log("开始处理流式响应...");
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let chunkCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("流式响应结束，总共处理了", chunkCount, "个数据块");
        break;
      }

      chunkCount++;
      console.log(`客户端收到第 ${chunkCount} 个数据块，长度:`, value?.length);
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        console.log("处理行:", line);
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          console.log("提取的数据:", data);
          if (data === '[DONE]') {
            console.log("收到流式响应结束标记");
            callbacks.onFinalContent(content);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            console.log("解析的JSON:", parsed);
            if (parsed.choices && parsed.choices[0]?.delta?.content) {
              const delta = parsed.choices[0].delta.content;
              content += delta;
              console.log("收到内容增量:", delta);
              callbacks.onContent(delta, content);
            }
          } catch (e) {
            console.warn("解析流式数据时出错:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("处理流式响应时出错:", error);
  } finally {
    reader.releaseLock();
  }
}

export default function PageClient({ chat }: { chat: Chat }) {
  const context = use(Context);
  const [streamPromise, setStreamPromise] = useState<
    Promise<ReadableStream> | undefined
  >(context.streamPromise);
  const [streamText, setStreamText] = useState("");
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === "assistant"),
  );
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const router = useRouter();
  const isHandlingStreamRef = useRef(false);
  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === "assistant").at(-1),
  );

  useEffect(() => {
    async function f() {
      if (!streamPromise || isHandlingStreamRef.current) return;

      isHandlingStreamRef.current = true;
      context.setStreamPromise(undefined);

      const stream = await streamPromise;
      let didPushToCode = false;
      let didPushToPreview = false;

      await processStream(stream, {
        onContent: (delta, content) => {
          setStreamText((text) => text + delta);

          if (
            !didPushToCode &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === "first-code-fence-generating",
            )
          ) {
            didPushToCode = true;
            setIsShowingCodeViewer(true);
            setActiveTab("code");
          }

          if (
            !didPushToPreview &&
            splitByFirstCodeFence(content).some(
              (part) => part.type === "first-code-fence",
            )
          ) {
            didPushToPreview = true;
            setIsShowingCodeViewer(true);
            setActiveTab("preview");
          }
        },
        onFinalContent: async (finalText) => {
          startTransition(async () => {
            const message = await createMessage(
              chat.id,
              finalText,
              "assistant",
            );

            startTransition(() => {
              isHandlingStreamRef.current = false;
              setStreamText("");
              setStreamPromise(undefined);
              setActiveMessage(message);
              router.refresh();
            });
          });
        },
      });
    }

    f();
  }, [chat.id, router, streamPromise, context]);

  return (
    <div className="h-dvh">
      <div className="flex h-full">
        <div className="mx-auto flex w-full shrink-0 flex-col overflow-hidden lg:w-1/2">
          <div className="flex items-center gap-4 px-4 py-4">
            <Link href="/">
              <LogoSmall />
            </Link>
            <p className="italic text-gray-500">{chat.title}</p>
          </div>

          <ChatLog
            chat={chat}
            streamText={streamText}
            activeMessage={activeMessage}
            onMessageClick={(message) => {
              if (message !== activeMessage) {
                setActiveMessage(message);
                setIsShowingCodeViewer(true);
              } else {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }
            }}
          />

          <ChatBox
            chat={chat}
            onNewStreamPromise={setStreamPromise}
            isStreaming={!!streamPromise}
          />
        </div>

        <CodeViewerLayout
          isShowing={isShowingCodeViewer}
          onClose={() => {
            setActiveMessage(undefined);
            setIsShowingCodeViewer(false);
          }}
        >
          {isShowingCodeViewer && (
            <CodeViewer
              streamText={streamText}
              chat={chat}
              message={activeMessage}
              onMessageChange={setActiveMessage}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }}
              onRequestFix={(error: string) => {
                startTransition(async () => {
                  let newMessageText = `The code is not working. Can you fix it? Here's the error:\n\n`;
                  newMessageText += error.trimStart();
                  const message = await createMessage(
                    chat.id,
                    newMessageText,
                    "user",
                  );

                  const streamPromise = fetch(
                    "/api/get-next-completion-stream-promise",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        messageId: message.id,
                        model: chat.model,
                      }),
                    },
                  ).then((res) => {
                    if (!res.body) {
                      throw new Error("No body on response");
                    }
                    return res.body;
                  });
                  setStreamPromise(streamPromise);
                  router.refresh();
                });
              }}
            />
          )}
        </CodeViewerLayout>
      </div>
    </div>
  );
}
