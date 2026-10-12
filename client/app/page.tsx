import Link from "next/link";
import {
  ArrowRight,
  Database,
  FileCode2,
  FolderGit2,
  MessageSquareCode,
  Sparkles,
} from "lucide-react";

import { RepofyIcon } from "@/components/icons/repofy-icon";
import { BrandMark } from "@/components/layout/app-shell";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { getGithubLoginUrl } from "@/lib/api";

const steps = [
  {
    title: "Connect GitHub",
    body: "Sign in with OAuth. The repo scope covers both public and private repositories.",
    icon: FolderGit2,
  },
  {
    title: "Index with RAG",
    body: "Your code is chunked, embedded, and stored in Postgres with pgvector.",
    icon: Database,
  },
  {
    title: "Ask anything",
    body: "Ask in plain English and get grounded answers with clickable source citations.",
    icon: MessageSquareCode,
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(from_var(--primary)_l_c_h/0.12),transparent_50%)]" />

      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <BrandMark />
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 py-14 md:py-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 py-1 pr-3 pl-1.5 text-xs text-muted-foreground backdrop-blur">
              <RepofyIcon className="size-5 rounded-md" />
              Repofy · chat with any repository
            </div>
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                Stop grepping.
                <br />
                <span className="text-muted-foreground">Start asking.</span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground text-balance">
                Repofy turns a GitHub repository into something you can question.
                Index it once, then get answers that point to the exact files and
                lines they came from.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={getGithubLoginUrl()}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex items-center gap-1.5"
                )}
              >
                <FolderGit2 className="size-4" />
                Continue with GitHub
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#how-it-works"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                See how it works
              </a>
            </div>
          </div>

          <div
            aria-label="Example conversation"
            className="rounded-2xl border bg-card/80 shadow-xs backdrop-blur"
          >
            <div className="flex items-center gap-1.5 border-b px-4 py-3">
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="ml-3 text-xs text-muted-foreground">
                acme/web-app
              </span>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-primary-foreground">
                Where do we validate the session cookie?
              </div>
              <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
                <p className="text-foreground">
                  Sessions are checked in the auth middleware before any
                  protected route runs. Expired or missing cookies are redirected
                  to the login page.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["src/middleware.ts:18", "src/lib/session.ts:42"].map(
                    (ref) => (
                      <span
                        key={ref}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 font-mono text-xs text-muted-foreground"
                      >
                        <FileCode2 className="size-3.5" />
                        {ref}
                      </span>
                    )
                  )}
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5" />
                Example answer with source citations
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 space-y-8">
          <div className="max-w-xl space-y-2">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              From repo to answers in three steps
            </h2>
            <p className="text-muted-foreground">
              No setup scripts and no local checkout. Connect, index, and ask.
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((item, index) => (
              <li
                key={item.title}
                className="relative rounded-2xl border bg-card/80 p-5 shadow-xs backdrop-blur"
              >
                <span className="absolute top-4 right-5 font-mono text-xs text-muted-foreground">
                  0{index + 1}
                </span>
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-muted">
                  <item.icon className="size-5 text-foreground" />
                </div>
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
