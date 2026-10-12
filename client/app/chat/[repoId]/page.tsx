"use client";

import { Suspense, use } from "react";

import { ChatView } from "@/components/chat/chat-view";
import { RequireAuth } from "@/components/providers/require-auth";

function ChatPageContent({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);

  return (
    <RequireAuth>
      <ChatView repoId={repoId} />
    </RequireAuth>
  );
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatPageContent params={params} />
    </Suspense>
  );
}
