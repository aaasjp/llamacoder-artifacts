/* eslint-disable @next/next/no-img-element */
"use client";

import Fieldset from "@/components/fieldset";
import ArrowRightIcon from "@/components/icons/arrow-right";
import LightningBoltIcon from "@/components/icons/lightning-bolt";
import LoadingButton from "@/components/loading-button";
import Spinner from "@/components/spinner";
import bgImg from "@/public/halo.png";
import * as Select from "@radix-ui/react-select";
import assert from "assert";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState, useRef, useTransition } from "react";
import { createChat } from "./actions";
import { Context } from "./providers";
import Header from "@/components/header";
import { useS3Upload } from "next-s3-upload";
import UploadIcon from "@/components/icons/upload-icon";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { MODELS, SUGGESTED_PROMPTS } from "@/lib/constants";

export default function Home() {
  const { setStreamPromise } = use(Context);
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [quality, setQuality] = useState("high");
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(
    undefined,
  );
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const selectedModel = MODELS.find((m) => m.value === model);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPending, startTransition] = useTransition();

  const { uploadToS3 } = useS3Upload();
  const handleScreenshotUpload = async (event: any) => {
    if (prompt.length === 0) setPrompt("构建这个");
    setQuality("low");
    setScreenshotLoading(true);
    let file = event.target.files[0];
    const { url } = await uploadToS3(file);
    setScreenshotUrl(url);
    setScreenshotLoading(false);
  };

  const textareaResizePrompt = prompt
    .split("\n")
    .map((text) => (text === "" ? "a" : text))
    .join("\n");

  return (
    <div className="relative flex grow flex-col bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="absolute inset-0 flex justify-center">
        <Image
          src={bgImg}
          alt=""
          className="max-h-[953px] w-full max-w-[1200px] object-cover object-top mix-blend-overlay opacity-60"
          priority
        />
      </div>

      <div className="isolate flex h-full grow flex-col">
        <Header />

        <div className="mt-10 flex grow flex-col items-center px-4 lg:mt-16">
          <a
            className="mb-4 inline-flex shrink-0 items-center rounded-full border-2 border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 px-7 py-3 text-xs text-purple-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 md:text-base animate-float"
            href="https://togetherai.link/?utm_source=llamacoder&utm_medium=referral&utm_campaign=example-app"
            target="_blank"
          >
            <span className="text-center">
              由 <span className="font-semibold text-purple-600">Together AI</span> 提供支持。
              已有
              <span className="font-semibold text-purple-600"> 110万+ 用户使用 </span>
            </span>
          </a>

          <h1 className="mt-4 text-balance text-center text-4xl leading-none text-gray-800 md:text-[64px] lg:mt-8 font-bold">
            <span className="text-3xl md:text-[48px]">将你的</span> <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-shift">想法</span>
            <br className="hidden md:block" /> <span className="text-3xl md:text-[48px]">变成</span>{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent animate-gradient-shift">应用</span>
          </h1>

          <form
            className="relative w-full max-w-2xl pt-6 lg:pt-12"
            action={async (formData) => {
              startTransition(async () => {
                const { prompt, model, quality } = Object.fromEntries(formData);

                assert.ok(typeof prompt === "string");
                assert.ok(typeof model === "string");
                assert.ok(quality === "high" || quality === "low");

                const { chatId, lastMessageId } = await createChat(
                  prompt,
                  model,
                  quality,
                  screenshotUrl,
                );

                const streamPromise = fetch(
                  "/api/get-next-completion-stream-promise",
                  {
                    method: "POST",
                    body: JSON.stringify({ messageId: lastMessageId, model }),
                  },
                ).then((res) => {
                  if (!res.body) {
                    throw new Error("No body on response");
                  }
                  return res.body;
                });

                startTransition(() => {
                  setStreamPromise(streamPromise);
                  router.push(`/chats/${chatId}`);
                });
              });
            }}
          >
            <Fieldset>
              <div className="relative flex w-full max-w-2xl rounded-2xl border-4 border-purple-200 bg-gradient-to-br from-white to-purple-50 pb-10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="w-full">
                  {screenshotLoading && (
                    <div className="relative mx-3 mt-3">
                      <div className="rounded-xl">
                                            <div className="group mb-2 flex h-16 w-[68px] animate-pulse items-center justify-center rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200">
                      <Spinner />
                    </div>
                      </div>
                    </div>
                  )}
                  {screenshotUrl && (
                    <div
                      className={`${isPending ? "invisible" : ""} relative mx-3 mt-3`}
                    >
                      <div className="rounded-xl">
                        <img
                          alt="截图"
                          src={screenshotUrl}
                          className="group relative mb-2 h-16 w-[68px] rounded"
                        />
                      </div>
                      <button
                        type="button"
                        id="x-circle-icon"
                        className="absolute -right-3 -top-4 left-14 z-10 size-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
                        onClick={() => {
                          setScreenshotUrl(undefined);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <XCircleIcon />
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <div className="p-3">
                      <p className="invisible w-full whitespace-pre-wrap">
                        {textareaResizePrompt}
                      </p>
                    </div>
                    <textarea
                      placeholder="为我构建一个预算应用..."
                      required
                      name="prompt"
                      rows={1}
                      className="peer absolute inset-0 w-full resize-none bg-transparent p-3 placeholder-purple-400 focus-visible:outline-none disabled:opacity-50"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          const target = event.target;
                          if (!(target instanceof HTMLTextAreaElement)) return;
                          target.closest("form")?.requestSubmit();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Select.Root
                      name="model"
                      value={model}
                      onValueChange={setModel}
                    >
                      <Select.Trigger className="inline-flex items-center gap-1 rounded-lg p-2 text-sm text-purple-600 hover:bg-purple-100 hover:text-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300 transition-all duration-200">
                        <Select.Value aria-label={model}>
                          <span>{selectedModel?.label}</span>
                        </Select.Value>
                        <Select.Icon>
                          <ChevronDownIcon className="size-3" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden rounded-xl bg-white shadow-xl ring-2 ring-purple-100 border border-purple-200">
                          <Select.Viewport className="space-y-1 p-2">
                            {MODELS.map((m) => (
                              <Select.Item
                                key={m.value}
                                value={m.value}
                                className="flex cursor-pointer items-center gap-1 rounded-lg p-2 text-sm data-[highlighted]:bg-purple-50 data-[highlighted]:outline-none transition-all duration-200"
                              >
                                <Select.ItemText className="inline-flex items-center gap-2 text-purple-700">
                                  {m.label}
                                </Select.ItemText>
                                <Select.ItemIndicator>
                                  <CheckIcon className="size-3 text-purple-600" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                          <Select.Arrow />
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>

                    <div className="h-4 w-px bg-purple-200 max-sm:hidden" />

                    <Select.Root
                      name="quality"
                      value={quality}
                      onValueChange={setQuality}
                    >
                      <Select.Trigger className="inline-flex items-center gap-1 rounded-lg p-2 text-sm text-purple-600 hover:bg-purple-100 hover:text-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300 transition-all duration-200">
                        <Select.Value aria-label={quality}>
                          <span className="max-sm:hidden">
                            {quality === "low"
                              ? "低质量 [更快]"
                              : "高质量 [较慢]"}
                          </span>
                          <span className="sm:hidden">
                            <LightningBoltIcon className="size-3" />
                          </span>
                        </Select.Value>
                        <Select.Icon>
                          <ChevronDownIcon className="size-3" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden rounded-xl bg-white shadow-xl ring-2 ring-purple-100 border border-purple-200">
                          <Select.Viewport className="space-y-1 p-2">
                            {[
                              { value: "low", label: "低质量 [更快]" },
                              {
                                value: "high",
                                label: "高质量 [较慢]",
                              },
                            ].map((q) => (
                              <Select.Item
                                key={q.value}
                                value={q.value}
                                className="flex cursor-pointer items-center gap-1 rounded-lg p-2 text-sm data-[highlighted]:bg-purple-50 data-[highlighted]:outline-none transition-all duration-200"
                              >
                                <Select.ItemText className="inline-flex items-center gap-2 text-purple-700">
                                  {q.label}
                                </Select.ItemText>
                                <Select.ItemIndicator>
                                  <CheckIcon className="size-3 text-purple-600" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                          <Select.Arrow />
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <div className="h-4 w-px bg-purple-200 max-sm:hidden" />
                    <div>
                      <label
                        htmlFor="screenshot"
                        className="flex cursor-pointer gap-2 text-sm text-purple-600 hover:text-purple-800 transition-all duration-200"
                      >
                        <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200">
                          <UploadIcon className="size-4" />
                        </div>
                        <div className="flex items-center justify-center font-medium">
                          附件
                        </div>
                      </label>
                      <input
                        // name="screenshot"
                        id="screenshot"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                        ref={fileInputRef}
                      />
                    </div>
                  </div>

                  <div className="relative flex shrink-0 has-[:disabled]:opacity-50">
                    <div className="pointer-events-none absolute inset-0 -bottom-[1px] rounded bg-blue-500" />

                    <LoadingButton
                      className="relative inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 font-medium text-white shadow-lg hover:shadow-xl outline-purple-300 hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-300 animate-pulse-glow"
                      type="submit"
                    >
                      <ArrowRightIcon />
                    </LoadingButton>
                  </div>
                </div>

                {isPending && (
                  <LoadingMessage
                    isHighQuality={quality === "high"}
                    screenshotUrl={screenshotUrl}
                  />
                )}
              </div>
              <div className="mt-4 flex w-full flex-wrap justify-center gap-3">
                {SUGGESTED_PROMPTS.map((v, index) => (
                  <button
                    key={v.title}
                    type="button"
                    onClick={() => setPrompt(v.description)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300 ${
                      index % 4 === 0 ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200' :
                      index % 4 === 1 ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 hover:from-blue-200 hover:to-cyan-200' :
                      index % 4 === 2 ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200' :
                      'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 hover:from-orange-200 hover:to-yellow-200'
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </Fieldset>
          </form>
        </div>

        <footer className="flex w-full flex-col items-center justify-between space-y-3 px-5 pb-3 pt-5 text-center sm:flex-row sm:pt-2 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-200">
          <div>
            <div className="font-medium text-purple-800">
              使用{" "}
              <a
                href="https://togetherai.link/?utm_source=llamacoder&utm_medium=referral&utm_campaign=example-app"
                className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent underline-offset-4 transition hover:from-purple-700 hover:to-pink-700 hover:underline"
              >
                Llama
              </a>{" "}
              和{" "}
              <a
                href="https://togetherai.link/?utm_source=llamacoder&utm_medium=referral&utm_campaign=example-app"
                className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent underline-offset-4 transition hover:from-blue-700 hover:to-cyan-700 hover:underline"
              >
                Together AI
              </a>
              构建。
            </div>
          </div>
          <div className="flex space-x-4 pb-4 sm:pb-0">
            <Link
              href="https://twitter.com/nutlope"
              className="group"
              aria-label=""
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6 fill-purple-500 group-hover:fill-purple-700 transition-colors duration-200"
              >
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0 0 22 5.92a8.19 8.19 0 0 1-2.357.646 4.118 4.118 0 0 0 1.804-2.27 8.224 8.224 0 0 1-2.605.996 4.107 4.107 0 0 0-6.993 3.743 11.65 11.65 0 0 1-8.457-4.287 4.106 4.106 0 0 0 1.27 5.477A4.073 4.073 0 0 1 2.8 9.713v.052a4.105 4.105 0 0 0 3.292 4.022 4.093 4.093 0 0 1-1.853.07 4.108 4.108 0 0 0 3.834 2.85A8.233 8.233 0 0 1 2 18.407a11.615 11.615 0 0 0 6.29 1.84" />
              </svg>
            </Link>
            <Link
              href="https://github.com/Nutlope/llamacoder"
              className="group"
              aria-label=""
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6 fill-purple-500 group-hover:fill-purple-700 transition-colors duration-200"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
              </svg>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function LoadingMessage({
  isHighQuality,
  screenshotUrl,
}: {
  isHighQuality: boolean;
  screenshotUrl: string | undefined;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 px-1 py-3 md:px-3 border border-purple-200">
      <div className="flex flex-col items-center justify-center gap-2 text-purple-700">
        <span className="animate-pulse text-balance text-center text-sm md:text-base font-medium">
          {isHighQuality
            ? `正在制定项目计划，可能需要15秒...`
            : screenshotUrl
              ? "正在分析您的截图..."
              : `正在创建您的应用...`}
        </span>

        <Spinner />
      </div>
    </div>
  );
}

export const maxDuration = 45;
