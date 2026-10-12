import type { IndexStatus, Repository } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Partial<Record<IndexStatus, string>> = {
  READY: "Ready",
  INDEXING: "Indexing",
  FAILED: "Failed",
};

const STATUS_VARIANTS: Partial<
  Record<IndexStatus, "default" | "secondary" | "destructive">
> = {
  READY: "default",
  INDEXING: "secondary",
  FAILED: "destructive",
};

export function indexStatusLabel(status: IndexStatus) {
  return STATUS_LABELS[status] ?? "Not indexed";
}

export function IndexStatusBadge({
  status,
  className,
}: {
  status: IndexStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? "outline"} className={className}>
      {status === "INDEXING" && (
        <span
          aria-hidden="true"
          className="mr-1 size-1.5 animate-pulse rounded-full bg-current"
        />
      )}
      {indexStatusLabel(status)}
    </Badge>
  );
}

// Full class names are written out so Tailwind can detect them.
const LANGUAGE_COLORS = new Map<string, string>([
  ["TypeScript", "bg-sky-500"],
  ["JavaScript", "bg-amber-400"],
  ["Java", "bg-orange-500"],
  ["Python", "bg-emerald-500"],
  ["Go", "bg-cyan-500"],
  ["Rust", "bg-orange-700"],
  ["Kotlin", "bg-violet-500"],
  ["C#", "bg-green-600"],
  ["C++", "bg-pink-500"],
  ["Ruby", "bg-red-500"],
  ["PHP", "bg-indigo-400"],
  ["Swift", "bg-orange-400"],
  ["HTML", "bg-rose-500"],
  ["CSS", "bg-blue-500"],
  ["Shell", "bg-lime-500"],
]);

export function languageColor(language: string | null) {
  return LANGUAGE_COLORS.get(language ?? "") ?? "bg-muted-foreground";
}

export function RepoMeta({ repo }: { repo: Repository }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {repo.language && (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", languageColor(repo.language))}
          />
          {repo.language}
        </span>
      )}
      <span>{repo.defaultBranch}</span>
      {repo.chunkCount > 0 && (
        <span>{repo.chunkCount.toLocaleString()} chunks</span>
      )}
    </div>
  );
}
