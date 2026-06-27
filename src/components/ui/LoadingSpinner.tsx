import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label = "불러오는 중...",
  className,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
  };

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "animate-spin rounded-full border-indigo-600 border-t-transparent",
          sizes[size],
        )}
        aria-hidden="true"
      />
      {label && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      )}
    </div>
  );
}
