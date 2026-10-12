"use client";

import { useMemo, useState } from "react";
import { AlertCircle, FilterX, FolderGit2, RefreshCw } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RepoCard } from "@/components/dashboard/repo-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useRefreshRepos, useRepos } from "@/hooks/use-repos";
import type { IndexStatus } from "@/lib/api";

type FilterStatus = "ALL" | IndexStatus;
type Visibility = "all" | "public" | "private";

const GRID_CLASS = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : "Something went wrong while loading your repositories.";
}

export function RepoDashboard() {
  const reposQuery = useRepos();
  const refresh = useRefreshRepos();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterStatus>("ALL");
  const [visibility, setVisibility] = useState<Visibility>("all");

  const repos = reposQuery.data;
  const totalCount = repos?.length ?? 0;
  const isSyncing = refresh.isPending || reposQuery.isFetching;
  const hasActiveFilters =
    search.trim() !== "" || status !== "ALL" || visibility !== "all";

  const filtered = useMemo(() => {
    const list = repos ?? [];
    const q = search.trim().toLowerCase();

    return list.filter((repo) => {
      if (status !== "ALL" && repo.indexStatus !== status) return false;
      if (visibility === "private" && !repo.isPrivate) return false;
      if (visibility === "public" && repo.isPrivate) return false;
      if (!q) return true;
      return (
        repo.fullName.toLowerCase().includes(q) ||
        (repo.description ?? "").toLowerCase().includes(q) ||
        (repo.language ?? "").toLowerCase().includes(q)
      );
    });
  }, [repos, search, status, visibility]);

  const readyCount = useMemo(
    () => (repos ?? []).filter((r) => r.indexStatus === "READY").length,
    [repos]
  );

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setVisibility("all");
  }

  function sync() {
    refresh.mutate();
  }

  return (
    <div className="flex min-h-full flex-col">
      <DashboardHeader
        search={search}
        onSearchChange={setSearch}
        visibility={visibility}
        onVisibilityChange={setVisibility}
        status={status}
        onStatusChange={setStatus}
        totalCount={reposQuery.data?.length}
        readyCount={readyCount}
        onSync={sync}
        isSyncing={isSyncing}
      />

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        {refresh.isError && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Sync failed</AlertTitle>
            <AlertDescription>
              {getErrorMessage(refresh.error)} Your existing repositories are
              still shown below.
            </AlertDescription>
          </Alert>
        )}

        {reposQuery.isLoading && (
          <div className={GRID_CLASS} aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        )}

        {reposQuery.isError && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderGit2 />
              </EmptyMedia>
              <EmptyTitle>Couldn’t load repositories</EmptyTitle>
              <EmptyDescription>
                {getErrorMessage(reposQuery.error)}
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => void reposQuery.refetch()}>Try again</Button>
          </Empty>
        )}

        {reposQuery.isSuccess && totalCount === 0 && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderGit2 />
              </EmptyMedia>
              <EmptyTitle>No repositories yet</EmptyTitle>
              <EmptyDescription>
                Sync with GitHub to bring in your public and private
                repositories, then index the ones you want to chat with.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={sync} disabled={isSyncing}>
              <RefreshCw
                className={isSyncing ? "size-4 animate-spin" : "size-4"}
              />
              Sync from GitHub
            </Button>
          </Empty>
        )}

        {reposQuery.isSuccess && totalCount > 0 && filtered.length === 0 && (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderGit2 />
              </EmptyMedia>
              <EmptyTitle>No repositories match</EmptyTitle>
              <EmptyDescription>
                Nothing fits your current search or filters. Clear them to see
                all {totalCount} repositories.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="size-4" />
              Clear filters
            </Button>
          </Empty>
        )}

        {reposQuery.isSuccess && filtered.length > 0 && (
          <>
            {hasActiveFilters && (
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <p aria-live="polite">
                  Showing {filtered.length} of {totalCount} repositories
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <FilterX className="size-4" />
                  Clear filters
                </Button>
              </div>
            )}
            <div className={GRID_CLASS}>
              {filtered.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
