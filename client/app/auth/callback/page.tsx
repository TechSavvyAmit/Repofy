"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { RepofyIcon } from "@/components/icons/repofy-icon";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: user, isLoading, isFetched } = useCurrentUser();

  useEffect(() => {
    if (!isFetched || isLoading) return;

    router.replace(user ? "/dashboard" : "/login?error=session");
  }, [user, isLoading, isFetched, router]);

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border bg-card/80 p-8 text-center shadow-xs backdrop-blur"
      >
        <RepofyIcon className="size-12 rounded-xl" />
        <div className="space-y-1.5">
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Signing you in
          </h1>
          <p className="text-sm text-muted-foreground text-balance">
            Confirming your GitHub session. Taking you to your dashboard
            shortly.
          </p>
        </div>
        <Spinner className="size-5" />
      </div>
    </main>
  );
}
