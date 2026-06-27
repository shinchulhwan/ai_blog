import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <LoadingSpinner size="lg" label="AI 블로그 자동 작성기를 불러오는 중입니다..." />
    </div>
  );
}
