import { APP_CONFIG } from "@/config/app.config";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50">
      <div className="flex flex-col items-center justify-between gap-2 px-4 py-6 text-center text-sm text-slate-500 sm:flex-row sm:text-left dark:text-slate-400">
        <p>
          &copy; {new Date().getFullYear()} {APP_CONFIG.name}
        </p>
        <p className="text-xs">OpenAI Responses API 기반</p>
      </div>
    </footer>
  );
}
