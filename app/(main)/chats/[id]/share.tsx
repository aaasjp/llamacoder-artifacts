"use client";

import ShareIcon from "@/components/icons/share-icon";
import { toast } from "@/hooks/use-toast";
import { Message } from "@prisma/client";

export function Share({ message }: { message?: Message }) {
  async function shareAction() {
    if (!message) return;

    const baseUrl = window.location.href;
    const shareUrl = new URL(`/share/v2/${message.id}`, baseUrl);

    toast({
      title: "App Published!",
      description: `App URL copied to clipboard: ${shareUrl.href}`,
      variant: "default",
    });

    await navigator.clipboard.writeText(shareUrl.href);
  }

  return (
    <form action={shareAction} className="flex">
      <button
        type="submit"
        disabled={!message}
        className="inline-flex items-center gap-1 rounded-lg border border-purple-200 px-2 py-1 text-sm text-purple-700 bg-white transition-all duration-200 enabled:hover:bg-purple-50 enabled:hover:border-purple-300 enabled:hover:shadow-sm disabled:opacity-50"
      >
        <ShareIcon className="size-3" />
        Share
      </button>
    </form>
  );
}
