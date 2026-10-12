"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  GitBranch,
  Lock,
  MessageSquare,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { IndexErrorAlert } from "@/components/dashboard/index-error-alert";
import { LanguageBadge } from "@/components/dashboard/language-badge";
import { IndexStatusBadge } from "@/components/dashboard/repo-status";
import { LanguageIcon } from "@/components/icons/language-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repos";
import type { Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

function Pill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Couldn’t start indexing. Please try again.";
}

export function RepoCard({ repo }: { repo: Repository }) {
  const router = useRouter();
  const indexMutation = useStartIndexing();
  const isReady = repo.indexStatus === "READY";
  const isFailed = repo.indexStatus === "FAILED";
  const isIndexing = repo.indexStatus === "INDEXING" || indexMutation.isPending;
  const progress = getRepoProgress(repo);

  // A fresh start-indexing error takes priority over the last stored failure.
  const errorMessage = indexMutation.isError
    ? getErrorMessage(indexMutation.error)
    : isFailed
      ? repo.errorMessage
      : null;

  function openChat() {
    router.push(`/chat/${repo.id}`);
  }

  function handlePrimary() {
    if (isReady) {
      openChat();
      return;
    }
    indexMutation.mutate(repo.id, {
      onSuccess: openChat,
    });
  }

  return (
    <article
      aria-busy={isIndexing}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-dashed bg-card/80 shadow-md shadow-foreground/5 transition-all",
        isFailed
          ? "border-destructive/30 bg-destructive/2 hover:border-destructive/40"
          : "border-border/80 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-foreground/10"
      )}
    >
      <div className="border-b border-dashed border-border/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <LanguageBadge language={repo.language} showLabel={false} />
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {repo.owner}
              </p>
              <h3 className="truncate font-medium">{repo.name}</h3>
            </div>
          </div>
          <IndexStatusBadge status={repo.indexStatus} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {(!isFailed || repo.description) && (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              isFailed ? "line-clamp-1" : "line-clamp-2 min-h-10"
            )}
          >
            {repo.description || "No description provided."}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {repo.isPrivate && (
            <Pill>
              <Lock className="size-3" />
              Private
            </Pill>
          )}
          <Pill>
            <GitBranch className="size-3" />
            {repo.defaultBranch}
          </Pill>
          {repo.language && (
            <Pill className="gap-1.5 text-foreground">
              <LanguageIcon language={repo.language} size="sm" />
              {repo.language}
            </Pill>
          )}
          {repo.chunkCount > 0 && (
            <Pill
              className={cn(isFailed && "border-destructive/20 text-destructive/80")}
            >
              {repo.chunkCount.toLocaleString()} chunks
              {isFailed ? " indexed" : ""}
            </Pill>
          )}
        </div>

        {isIndexing && (
          <div className="space-y-2 rounded-xl border border-dashed bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Indexing…</span>
              <span>
                {repo.filesProcessed}/{repo.filesTotal || "?"}
              </span>
            </div>
            <Progress value={progress || 8} aria-label="Indexing progress" />
          </div>
        )}

        {errorMessage && <IndexErrorAlert message={errorMessage} />}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-border/70 p-4">
        {repo.htmlUrl ? (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<a href={repo.htmlUrl} target="_blank" rel="noreferrer" />}
          >
            <ExternalLink data-icon="inline-start" />
            GitHub
          </Button>
        ) : (
          <span />
        )}

        <Button
          size="sm"
          variant={isFailed ? "outline" : "default"}
          className={cn(
            isFailed &&
              "border-destructive/30 text-destructive hover:bg-destructive/10"
          )}
          disabled={isIndexing}
          onClick={handlePrimary}
          aria-label={isReady ? `Chat with ${repo.fullName}` : undefined}
        >
          {isIndexing ? (
            <>
              <Spinner data-icon="inline-start" />
              Indexing
            </>
          ) : isReady ? (
            <>
              <MessageSquare data-icon="inline-start" />
              Chat
            </>
          ) : isFailed ? (
            <>
              <RotateCcw data-icon="inline-start" />
              Retry
            </>
          ) : (
            <>
              <Sparkles data-icon="inline-start" />
              Index
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
