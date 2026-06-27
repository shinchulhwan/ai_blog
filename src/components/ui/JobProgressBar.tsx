import { cn } from "@/lib/utils";
import type { JobProgress } from "@/types/job";

interface JobProgressBarProps {
  progress: JobProgress;
  className?: string;
}

export function JobProgressBar({ progress, className }: JobProgressBarProps) {
  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>진행률</span>
        <span>{progress}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
