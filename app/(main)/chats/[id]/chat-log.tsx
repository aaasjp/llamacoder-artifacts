"use client";

import type { Chat, Message } from "./page";
import ArrowLeftIcon from "@/components/icons/arrow-left";
import { splitByFirstCodeFence } from "@/lib/utils";
import { Fragment } from "react";
import Markdown from "react-markdown";
import { StickToBottom } from "use-stick-to-bottom";

export default function ChatLog({
  chat,
  activeMessage,
  streamText,
  onMessageClick,
}: {
  chat: Chat;
  activeMessage?: Message;
  streamText: string;
  onMessageClick: (v: Message) => void;
}) {
  const assistantMessages = chat.messages.filter((m) => m.role === "assistant");

  return (
    <StickToBottom
      className="relative grow overflow-hidden"
      resize="smooth"
      initial="smooth"
    >
      <StickToBottom.Content className="mx-auto flex w-full max-w-prose flex-col gap-8 p-8">
        <UserMessage content={chat.prompt} />

        {chat.messages.slice(2).map((message) => (
          <Fragment key={message.id}>
            {message.role === "user" ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessage
                content={message.content}
                version={
                  assistantMessages.map((m) => m.id).indexOf(message.id) + 1
                }
                message={message}
                isActive={!streamText && activeMessage?.id === message.id}
                onMessageClick={onMessageClick}
              />
            )}
          </Fragment>
        ))}

        {streamText && (
          <AssistantMessage
            content={streamText}
            version={assistantMessages.length + 1}
            isActive={true}
          />
        )}
      </StickToBottom.Content>
    </StickToBottom>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="relative inline-flex max-w-[80%] items-end gap-3 self-end">
      <div className="whitespace-pre-wrap rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-3 text-purple-800 shadow-lg border border-purple-200">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({
  content,
  version,
  message,
  isActive,
  onMessageClick = () => {},
}: {
  content: string;
  version: number;
  message?: Message;
  isActive?: boolean;
  onMessageClick?: (v: Message) => void;
}) {
  const parts = splitByFirstCodeFence(content);

  return (
    <div>
      {parts.map((part, i) => (
        <div key={i}>
          {part.type === "text" ? (
            <Markdown className="prose">{part.content}</Markdown>
          ) : part.type === "first-code-fence-generating" ? (
            <div className="my-4">
              <button
                disabled
                className="inline-flex w-full animate-pulse items-center gap-2 rounded-xl border-4 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-2"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-white">
                  V{version}
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none">
                    Generating...
                  </div>
                </div>
              </button>
            </div>
          ) : message ? (
            <div className="my-4">
              <button
                className={`${isActive ? "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300" : "bg-gradient-to-r from-gray-100 to-gray-200 hover:border-purple-300 hover:from-purple-50 hover:to-pink-50"} inline-flex w-full items-center gap-2 rounded-xl border-4 p-2 transition-all duration-300 hover:scale-105`}
                onClick={() => onMessageClick(message)}
              >
                <div
                  className={`${isActive ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"} flex size-8 items-center justify-center rounded-lg font-bold`}
                >
                  V{version}
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none">
                    {toTitleCase(part.filename.name)}{" "}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-xs leading-none text-gray-500">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {"."}
                    {part.filename.extension}
                  </div>
                </div>
                <div className="ml-auto">
                  <ArrowLeftIcon />
                </div>
              </button>
            </div>
          ) : (
            <div className="my-4">
              <button
                className="inline-flex w-full items-center gap-2 rounded-xl border-4 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-2"
                disabled
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-r from-gray-400 to-gray-500 font-bold text-white">
                  V{version}
                </div>
                <div className="flex flex-col gap-0.5 text-left leading-none">
                  <div className="text-sm font-medium leading-none">
                    {toTitleCase(part.filename.name)}{" "}
                    {version !== 1 && `v${version}`}
                  </div>
                  <div className="text-xs leading-none text-gray-500">
                    {part.filename.name}
                    {version !== 1 && `-v${version}`}
                    {"."}
                    {part.filename.extension}
                  </div>
                </div>
                <div className="ml-auto">
                  <ArrowLeftIcon />
                </div>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function toTitleCase(rawName: string): string {
  // Split on one or more hyphens or underscores
  const parts = rawName.split(/[-_]+/);

  // Capitalize each part and join them back with spaces
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
