"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { IndexingState } from "@/components/chat/indexing-state";
import { RepoMeta } from "@/components/dashboard/repo-status";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChatMessages,
  useChatSessions,
  useCreateChatSession,
  useStreamChat,
} from "@/hooks/use-chat";
import { useIndexStatus, useRepository } from "@/hooks/use-repos";

function errorText(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ChatProblem({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-start gap-3">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

export function ChatView({ repoId }: { repoId: string }) {
  const repoQuery = useRepository(repoId);
  const baseRepo = repoQuery.data;

  const shouldPoll =
    baseRepo?.indexStatus === "INDEXING" || baseRepo?.indexStatus === "PENDING";
  const statusQuery = useIndexStatus(repoId, shouldPoll);
  const liveStatus = statusQuery.data;

  // Overlay live indexing progress on top of the cached repository.
  const repo = useMemo(
    () =>
      baseRepo && {
        ...baseRepo,
        indexStatus: liveStatus?.indexStatus ?? baseRepo.indexStatus,
        filesProcessed: liveStatus?.filesProcessed ?? baseRepo.filesProcessed,
        filesTotal: liveStatus?.filesTotal ?? baseRepo.filesTotal,
        chunkCount: liveStatus?.chunkCount ?? baseRepo.chunkCount,
        errorMessage: liveStatus?.errorMessage ?? baseRepo.errorMessage,
      },
    [baseRepo, liveStatus]
  );
  const ready = repo?.indexStatus === "READY";

  const sessionsQuery = useChatSessions(repoId, ready);
  const { mutate: createSession, isError: createFailed, error: createError } =
    useCreateChatSession(repoId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const autoCreateRef = useRef(false);

  const sessionId = selectedSessionId ?? sessionsQuery.data?.[0]?.id ?? null;

  const messagesQuery = useChatMessages(sessionId);
  const { send, stop, streaming, streamText } = useStreamChat(sessionId);

  function startSession() {
    autoCreateRef.current = true;
    createSession(undefined, {
      onSuccess: (session) => setSelectedSessionId(session.id),
      onError: () => {
        autoCreateRef.current = false;
      },
    });
  }

  // First visit: open a session automatically once the repo is ready. A failed
  // attempt surfaces an error with a retry button instead of looping.
  useEffect(() => {
    if (!ready || !sessionsQuery.isSuccess || autoCreateRef.current) return;
    if ((sessionsQuery.data?.length ?? 0) > 0) return;
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sessionsQuery.isSuccess, sessionsQuery.data]);

  if (repoQuery.isLoading) {
    return (
      <AppShell title="Loading chat…">
        <div className="grid flex-1 gap-4 p-4 md:grid-cols-[18rem_1fr]">
          <Skeleton className="min-h-80 rounded-2xl" />
          <Skeleton className="min-h-80 rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (repoQuery.isError || !repo) {
    return (
      <AppShell title="Repository unavailable">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
          <p className="text-sm text-muted-foreground">
            {errorText(repoQuery.error, "Repository not found")}
          </p>
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Back to dashboard
          </Button>
        </div>
      </AppShell>
    );
  }

  let body;
  if (!ready) {
    body = <IndexingState repo={repo} status={liveStatus} />;
  } else if (sessionsQuery.isError) {
    body = (
      <ChatProblem
        title="Couldn’t load your chats"
        message={errorText(sessionsQuery.error, "Please try again.")}
        onRetry={() => void sessionsQuery.refetch()}
      />
    );
  } else if (createFailed && !sessionId) {
    body = (
      <ChatProblem
        title="Couldn’t start a chat"
        message={errorText(createError, "Please try again.")}
        onRetry={startSession}
      />
    );
  } else {
    body = (
      <>
        <div className="flex items-center justify-between gap-3 border-b border-dashed px-4 py-2">
          <RepoMeta repo={repo} />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Answers cite files from this repository
          </span>
        </div>
        <ChatMessages
          repo={repo}
          messages={messagesQuery.data ?? []}
          isStreaming={streaming}
          streamText={streamText}
          isLoading={messagesQuery.isLoading}
          onSuggest={sessionId ? send : undefined}
        />
        <ChatComposer
          disabled={!sessionId}
          streaming={streaming}
          onSend={send}
          onStop={stop}
        />
      </>
    );
  }

  return (
    <AppShell
      title={repo.fullName}
      description={
        ready
          ? "Ask questions grounded in this repository"
          : "Waiting for indexing to finish"
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Repos
        </Button>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <ChatSidebar
          repo={repo}
          sessionId={sessionId}
          onSelectSession={setSelectedSessionId}
        />

        <section className="flex min-h-[70vh] min-w-0 flex-1 flex-col">
          {body}
        </section>
      </div>
    </AppShell>
  );
}
