"use client";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BlogHistoryStatusBadge } from "@/components/history/BlogHistoryStatusBadge";
import { formatKoreanDate } from "@/lib/utils";
import type { BlogHistoryListItem } from "@/types/history";

interface HistoryListProps {
  histories: BlogHistoryListItem[];
  isLoading: boolean;
  isSubmitting: boolean;
  regeneratingId: string | null;
  selectedId: string | null;
  onViewDetail: (item: BlogHistoryListItem) => void;
  onDelete: (item: BlogHistoryListItem) => void;
  onRegenerate: (item: BlogHistoryListItem) => void;
}

export function HistoryList({
  histories,
  isLoading,
  isSubmitting,
  regeneratingId,
  selectedId,
  onViewDetail,
  onDelete,
  onRegenerate,
}: HistoryListProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <LoadingSpinner size="lg" label="생성 이력을 불러오는 중입니다..." className="py-12" />
      </section>
    );
  }

  if (histories.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            생성 이력이 없습니다
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            블로그 작성 페이지에서 AI 글을 생성하면 이력이 자동으로 저장됩니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          생성 이력 목록
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          총 {histories.length}개의 이력이 있습니다.
        </p>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">키워드</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">제목</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">SEO</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">상태</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">생성일</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {histories.map((item) => {
              const isRegenerating = regeneratingId === item.id;
              const isSelected = selectedId === item.id;

              return (
                <tr
                  key={item.id}
                  className={
                    isSelected
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                      : "text-slate-700 dark:text-slate-300"
                  }
                >
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {item.keyword}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4">{item.selectedTitle}</td>
                  <td className="px-6 py-4">{item.seoScore}</td>
                  <td className="px-6 py-4">
                    <BlogHistoryStatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatKoreanDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onViewDetail(item)}
                        disabled={isSubmitting || isRegenerating}
                      >
                        상세보기
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onRegenerate(item)}
                        isLoading={isRegenerating}
                        disabled={isSubmitting || isRegenerating}
                      >
                        다시 생성
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                        disabled={isSubmitting || isRegenerating}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 lg:hidden dark:divide-slate-800">
        {histories.map((item) => {
          const isRegenerating = regeneratingId === item.id;
          const isSelected = selectedId === item.id;

          return (
            <div
              key={item.id}
              className={
                isSelected
                  ? "space-y-3 bg-indigo-50/50 px-4 py-4 dark:bg-indigo-950/20"
                  : "space-y-3 px-4 py-4"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{item.keyword}</p>
                  <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                    {item.selectedTitle}
                  </p>
                </div>
                <BlogHistoryStatusBadge status={item.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>SEO {item.seoScore}점</span>
                <span>{formatKoreanDate(item.createdAt)}</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewDetail(item)}
                  disabled={isSubmitting || isRegenerating}
                  className="flex-1"
                >
                  상세보기
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onRegenerate(item)}
                  isLoading={isRegenerating}
                  disabled={isSubmitting || isRegenerating}
                  className="flex-1"
                >
                  다시 생성
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item)}
                  disabled={isSubmitting || isRegenerating}
                  className="flex-1"
                >
                  삭제
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
