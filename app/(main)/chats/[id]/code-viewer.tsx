"use client";

import ChevronLeftIcon from "@/components/icons/chevron-left";
import ChevronRightIcon from "@/components/icons/chevron-right";
import CloseIcon from "@/components/icons/close-icon";
import RefreshIcon from "@/components/icons/refresh";
import { extractFirstCodeBlock, splitByFirstCodeFence } from "@/lib/utils";
import { useState } from "react";
import type { Chat, Message } from "./page";
import { Share } from "./share";
import { StickToBottom } from "use-stick-to-bottom";
import dynamic from "next/dynamic";

const CodeRunner = dynamic(() => import("@/components/code-runner"), {
  ssr: false,
});
const SyntaxHighlighter = dynamic(
  () => import("@/components/syntax-highlighter"),
  {
    ssr: false,
  },
);

export default function CodeViewer({
  chat,
  streamText,
  message,
  onMessageChange,
  activeTab,
  onTabChange,
  onClose,
  onRequestFix,
}: {
  chat: Chat;
  streamText: string;
  message?: Message;
  onMessageChange: (v: Message) => void;
  activeTab: string;
  onTabChange: (v: "code" | "preview") => void;
  onClose: () => void;
  onRequestFix: (e: string) => void;
}) {
  const app = message ? extractFirstCodeBlock(message.content) : undefined;
  const streamAppParts = splitByFirstCodeFence(streamText);
  const streamApp = streamAppParts.find(
    (p) =>
      p.type === "first-code-fence-generating" || p.type === "first-code-fence",
  );
  const streamAppIsGenerating = streamAppParts.some(
    (p) => p.type === "first-code-fence-generating",
  );

  const code = streamApp ? streamApp.content : app?.code || "";
  const language = streamApp ? streamApp.language : app?.language || "";
  const title = streamApp ? streamApp.filename.name : app?.filename?.name || "";
  const layout = ["python", "ts", "js", "javascript", "typescript"].includes(
    language,
  )
    ? "two-up"
    : "tabbed";

  const assistantMessages = chat.messages.filter((m) => m.role === "assistant");
  const currentVersion = streamApp
    ? assistantMessages.length
    : message
      ? assistantMessages.map((m) => m.id).indexOf(message.id)
      : 1;
  const previousMessage =
    currentVersion !== 0 ? assistantMessages.at(currentVersion - 1) : undefined;
  const nextMessage =
    currentVersion < assistantMessages.length
      ? assistantMessages.at(currentVersion + 1)
      : undefined;

  const [refresh, setRefresh] = useState(0);

  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4">
        <div className="inline-flex items-center gap-4">
          <button
            className="text-purple-600 hover:text-purple-800 transition-colors duration-200"
            onClick={onClose}
          >
            <CloseIcon className="size-5" />
          </button>
          <span className="font-medium text-purple-800">
            {title} v{currentVersion + 1}
          </span>
        </div>
        {layout === "tabbed" && (
          <div className="rounded-lg border-2 border-purple-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => onTabChange("code")}
              data-active={activeTab === "code" ? true : undefined}
              className="inline-flex h-7 w-16 items-center justify-center rounded text-xs font-medium transition-all duration-200 data-[active]:bg-gradient-to-r data-[active]:from-purple-500 data-[active]:to-pink-500 data-[active]:text-white data-[active]:shadow-sm"
            >
              代码
            </button>
            <button
              onClick={() => onTabChange("preview")}
              data-active={activeTab === "preview" ? true : undefined}
              className="inline-flex h-7 w-16 items-center justify-center rounded text-xs font-medium transition-all duration-200 data-[active]:bg-gradient-to-r data-[active]:from-purple-500 data-[active]:to-pink-500 data-[active]:text-white data-[active]:shadow-sm"
            >
              预览
            </button>
          </div>
        )}
      </div>

      {layout === "tabbed" ? (
        <div className="flex grow flex-col overflow-y-auto bg-white">
          {activeTab === "code" ? (
            <StickToBottom
              className="relative grow overflow-hidden"
              resize="smooth"
              initial={streamAppIsGenerating ? "smooth" : false}
            >
              <StickToBottom.Content>
                <SyntaxHighlighter code={code} language={language} />
              </StickToBottom.Content>
            </StickToBottom>
          ) : (
            <>
              {language && (
                <div className="flex h-full items-center justify-center">
                  <CodeRunner
                    onRequestFix={onRequestFix}
                    language={language}
                    code={code}
                    key={refresh}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex grow flex-col bg-white">
          <div className="h-1/2 overflow-y-auto">
            <SyntaxHighlighter code={code} language={language} />
          </div>
          <div className="flex h-1/2 flex-col">
            <div className="border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-4 font-medium text-purple-800">输出</div>
            <div className="flex grow items-center justify-center border-t border-purple-200">
              {!streamAppIsGenerating && (
                <CodeRunner
                  onRequestFix={onRequestFix}
                  language={language}
                  code={code}
                  key={refresh}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-4">
        <div className="inline-flex items-center gap-2.5 text-sm">
          <Share message={message && !streamApp ? message : undefined} />
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-purple-200 px-2 py-1 text-sm text-purple-700 bg-white transition-all duration-200 enabled:hover:bg-purple-50 enabled:hover:border-purple-300 enabled:hover:shadow-sm disabled:opacity-50"
            onClick={() => setRefresh((r) => r + 1)}
          >
            <RefreshIcon className="size-3" />
            刷新
          </button>
        </div>
        <div className="flex items-center justify-end gap-3">
          {previousMessage ? (
            <button
              className="text-purple-700 hover:text-purple-900 transition-colors duration-200"
              onClick={() => onMessageChange(previousMessage)}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
          ) : (
            <button className="text-purple-300" disabled>
              <ChevronLeftIcon className="size-4" />
            </button>
          )}

          <p className="text-sm text-purple-800">
            Version <span className="tabular-nums font-medium">{currentVersion + 1}</span>{" "}
            <span className="text-purple-500">of</span>{" "}
            <span className="tabular-nums font-medium">
              {Math.max(currentVersion + 1, assistantMessages.length)}
            </span>
          </p>

          {nextMessage ? (
            <button
              className="text-purple-700 hover:text-purple-900 transition-colors duration-200"
              onClick={() => onMessageChange(nextMessage)}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          ) : (
            <button className="text-purple-300" disabled>
              <ChevronRightIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
