"use client";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { KeywordStatusBadge } from "@/components/keywords/KeywordStatusBadge";
import { formatKoreanDate } from "@/lib/utils";
import type { KeywordRecord } from "@/types/keyword";

interface KeywordListProps {
  keywords: KeywordRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  onEdit: (keyword: KeywordRecord) => void;
  onDelete: (keyword: KeywordRecord) => void;
}

export function KeywordList({
  keywords,
  isLoading,
  isSubmitting,
  onEdit,
  onDelete,
}: KeywordListProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <LoadingSpinner size="lg" label="키워드 목록을 불러오는 중입니다..." className="py-12" />
      </section>
    );
  }

  if (keywords.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            등록된 키워드가 없습니다
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            위 폼에서 키워드를 추가하면 자동 생성 대기 목록에 등록됩니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          키워드 목록
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          총 {keywords.length}개의 키워드가 등록되어 있습니다.
        </p>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">키워드</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">카테고리</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">상태</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">생성일</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">마지막 생성일</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {keywords.map((item) => (
              <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  {item.keyword}
                </td>
                <td className="px-6 py-4">{item.category}</td>
                <td className="px-6 py-4">
                  <KeywordStatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatKoreanDate(item.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatKoreanDate(item.lastGeneratedAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(item)}
                      disabled={isSubmitting}
                    >
                      수정
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item)}
                      disabled={isSubmitting}
                    >
                      삭제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
        {keywords.map((item) => (
          <div key={item.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{item.keyword}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {item.category}
                </p>
              </div>
              <KeywordStatusBadge status={item.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">생성일</p>
                <p className="mt-1">{formatKoreanDate(item.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">마지막 생성일</p>
                <p className="mt-1">{formatKoreanDate(item.lastGeneratedAt)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onEdit(item)}
                disabled={isSubmitting}
                className="flex-1"
              >
                수정
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item)}
                disabled={isSubmitting}
                className="flex-1"
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
