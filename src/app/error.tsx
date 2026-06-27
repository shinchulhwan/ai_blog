"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 dark:bg-slate-950">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          오류가 발생했습니다
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          {error.message || "예기치 않은 오류가 발생했습니다. 다시 시도해 주세요."}
        </p>
      </div>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
