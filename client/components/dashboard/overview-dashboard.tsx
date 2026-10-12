"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  FolderGit2,
  MessageSquareCode,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { RepoCard } from "@/components/dashboard/repo-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRepos } from "@/hooks/use-repos";

const RECENT_LIMIT = 3;
const RECENT_GRID_CLASS =
  "grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card size="sm">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-1 text-2xl font-semibold">{value}</CardTitle>
          </div>
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">
          {hint}
        </CardContent>
      ) : null}
    </Card>
  );
}

function StatusRow({
  label,
  value,
  variant = "secondary",
}: {
  label: string;
  value: number;
  variant?: "secondary" | "destructive";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={variant}>{value}</Badge>
    </div>
  );
}

function toTime(value: string | number | Date | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

export function OverviewDashboard() {
  const reposQuery = useRepos();

  const stats = useMemo(() => {
    const repos = reposQuery.data ?? [];
    let ready = 0;
    let indexing = 0;
    let pending = 0;
    let failed = 0;
    let chunks = 0;

    for (const repo of repos) {
      chunks += repo.chunkCount;
      switch (repo.indexStatus) {
        case "READY":
          ready++;
          break;
        case "INDEXING":
          indexing++;
          break;
        case "PENDING":
          pending++;
          break;
        case "FAILED":
          failed++;
          break;
      }
    }

    const recent = [...repos]
      .sort((a, b) => toTime(b.indexedAt) - toTime(a.indexedAt))
      .slice(0, RECENT_LIMIT);

    return { total: repos.length, ready, indexing, pending, failed, chunks, recent };
  }, [reposQuery.data]);

  if (reposQuery.isError) {
    const message =
      reposQuery.error instanceof Error && reposQuery.error.message
        ? reposQuery.error.message
        : "Something went wrong while loading your repositories.";

    return (
      <div className="flex flex-1 flex-col items-start gap-4 p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Couldn’t load your overview</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void reposQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const isLoading = reposQuery.isLoading;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Repositories"
              value={stats.total}
              hint="Connected from GitHub"
              icon={FolderGit2}
            />
            <StatCard
              label="Ready to chat"
              value={stats.ready}
              hint={`${stats.indexing} currently indexing`}
              icon={CheckCircle2}
            />
            <StatCard
              label="Indexed chunks"
              value={stats.chunks.toLocaleString()}
              hint="Searchable code segments"
              icon={MessageSquareCode}
            />
            <StatCard
              label="Needs attention"
              value={stats.failed}
              hint={
                stats.failed > 0
                  ? "Review failed indexing jobs"
                  : "All repos healthy"
              }
              icon={stats.failed > 0 ? AlertCircle : ShieldCheck}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Recent repositories
              </h2>
              <p className="text-sm text-muted-foreground">
                Jump back into a repo you have indexed recently.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className={RECENT_GRID_CLASS}>
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-44 rounded-2xl" />
              ))}
            </div>
          ) : stats.recent.length > 0 ? (
            <div className={RECENT_GRID_CLASS}>
              {stats.recent.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No repositories yet</CardTitle>
                <CardDescription>
                  Sync your GitHub repositories to start indexing and chatting
                  with your code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Go to repositories
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Workspace status
            </h2>
            <p className="text-sm text-muted-foreground">
              A quick snapshot of indexing across your connected repos.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-3 pt-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 rounded-lg" />
                ))
              ) : (
                <>
                  <StatusRow label="Ready" value={stats.ready} />
                  <StatusRow label="Indexing" value={stats.indexing} />
                  <StatusRow label="Pending" value={stats.pending} />
                  <StatusRow
                    label="Failed"
                    value={stats.failed}
                    variant={stats.failed > 0 ? "destructive" : "secondary"}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
