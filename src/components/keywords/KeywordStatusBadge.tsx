import { KEYWORD_STATUS_LABELS, type KeywordStatus } from "@/types/keyword";
import { cn } from "@/lib/utils";

interface KeywordStatusBadgeProps {
  status: KeywordStatus;
  className?: string;
}

const STATUS_STYLES: Record<KeywordStatus, string> = {
  PENDING:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  COMPLETED:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  FAILED:
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function KeywordStatusBadge({ status, className }: KeywordStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {KEYWORD_STATUS_LABELS[status]}
    </span>
  );
}
