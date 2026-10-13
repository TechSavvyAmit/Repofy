"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ArrowDown, CornerDownRight, UserRound } from "lucide-react";

import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { CitationChips } from "@/components/chat/citation-chips";
import { RepofyIcon } from "@/components/icons/repofy-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage, Repository } from "@/lib/api";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Where is authentication handled?",
  "How do I run this project locally?",
  "Which file defines the API routes?",
  "How does error handling work?",
];

function AssistantAvatar() {
  return (
    <MessageAvatar>
      <RepofyIcon className="size-8 rounded-lg" />
    </MessageAvatar>
  );
}

function UserAvatar() {
  return (
    <MessageAvatar>
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <UserRound className="size-4" />
        </AvatarFallback>
      </Avatar>
    </MessageAvatar>
  );
}

function EmptyState({
  repo,
  onSuggest,
}: {
  repo: Repository;
  onSuggest?: (prompt: string) => void;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-dashed bg-muted/30 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <RepofyIcon className="size-10 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="font-medium">Ask anything about this codebase</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {repo.fullName}
          </p>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              disabled={!onSuggest}
              onClick={() => onSuggest?.(prompt)}
              className="group flex w-full items-start gap-2 rounded-xl border border-dashed bg-card/80 px-3 py-2.5 text-left text-sm transition-colors hover:border-foreground/20 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
            >
              <CornerDownRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThinkingMessage() {
  return (
    <Message align="start">
      <AssistantAvatar />
      <MessageContent>
        <Bubble variant="muted" align="start">
          <BubbleContent
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-muted-foreground"
          >
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
            Searching the codebase…
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

// Memoized so finished messages don't re-render (and re-parse markdown) on
// every streamed token.
const MessageItem = memo(function MessageItem({
  repo,
  message,
}: {
  repo: Repository;
  message: ChatMessage;
}) {
  const isUser = message.role === "USER";
  const citations = message.citations ?? [];

  return (
    <Message align={isUser ? "end" : "start"}>
      {isUser ? <UserAvatar /> : <AssistantAvatar />}
      <MessageContent>
        <Bubble
          variant={isUser ? "default" : "muted"}
          align={isUser ? "end" : "start"}
          className={cn(!isUser && "max-w-full")}
        >
          <BubbleContent
            className={cn(!isUser && "w-full max-w-full px-4 py-3")}
          >
            {isUser ? (
              <span className="whitespace-pre-wrap">{message.content}</span>
            ) : (
              <ChatMarkdown content={message.content} />
            )}
          </BubbleContent>
        </Bubble>
        {!isUser && citations.length > 0 && (
          <MessageFooter>
            <CitationChips repo={repo} citations={citations} />
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
});

export function ChatMessages({
  repo,
  messages,
  isStreaming,
  streamText,
  isLoading,
  onSuggest,
}: {
  repo: Repository;
  messages: ChatMessage[];
  isStreaming?: boolean;
  streamText?: string;
  isLoading?: boolean;
  onSuggest?: (prompt: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const prevCountRef = useRef(messages.length);
  const [showJump, setShowJump] = useState(false);

  // Track whether the reader is at the bottom so streaming doesn't yank them
  // back down after they scroll up to read earlier answers.
  useEffect(() => {
    const node = bottomRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      stickRef.current = entry.isIntersecting;
      setShowJump(!entry.isIntersecting);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isLoading]);

  useEffect(() => {
    const wasEmpty = prevCountRef.current === 0;
    const added = messages.length > prevCountRef.current;
    prevCountRef.current = messages.length;

    const sentByUser = added && messages[messages.length - 1]?.role === "USER";
    if (!sentByUser && !stickRef.current) return;

    bottomRef.current?.scrollIntoView({
      behavior: isStreaming || wasEmpty ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, isStreaming, streamText]);

  function jumpToLatest() {
    stickRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-16 w-2/3 rounded-3xl" />
        <Skeleton className="ml-auto h-12 w-1/2 rounded-3xl" />
        <Skeleton className="h-24 w-3/4 rounded-3xl" />
      </div>
    );
  }

  const showEmpty = messages.length === 0 && !streamText && !isStreaming;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
          {showEmpty && <EmptyState repo={repo} onSuggest={onSuggest} />}

          <MessageGroup>
            {messages.map((message) => (
              <MessageItem key={message.id} repo={repo} message={message} />
            ))}

            {isStreaming && !streamText && <ThinkingMessage />}

            {streamText && (
              <Message align="start">
                <AssistantAvatar />
                <MessageContent>
                  <Bubble variant="muted" align="start" className="max-w-full">
                    <BubbleContent className="w-full max-w-full px-4 py-3">
                      <ChatMarkdown content={streamText} isStreaming />
                      <span
                        aria-hidden="true"
                        className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/50 align-middle motion-reduce:animate-none"
                      />
                    </BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            )}
          </MessageGroup>
          <div ref={bottomRef} className="h-4" aria-hidden="true" />
        </div>
      </ScrollArea>

      {showJump && (
        <Button
          variant="outline"
          size="sm"
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/90 shadow-md backdrop-blur"
        >
          <ArrowDown data-icon="inline-start" />
          Latest
        </Button>
      )}
    </div>
  );
}