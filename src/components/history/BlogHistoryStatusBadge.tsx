import { BLOG_HISTORY_STATUS_LABELS, type BlogHistoryStatus } from "@/types/history";
import { cn } from "@/lib/utils";

interface BlogHistoryStatusBadgeProps {
  status: BlogHistoryStatus;
  className?: string;
}

const STATUS_STYLES: Record<BlogHistoryStatus, string> = {
  CREATED:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  READY:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  PUBLISHED:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  FAILED:
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  PUBLISHING:
    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

export function BlogHistoryStatusBadge({
  status,
  className,
}: BlogHistoryStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {BLOG_HISTORY_STATUS_LABELS[status]}
    </span>
  );
}
