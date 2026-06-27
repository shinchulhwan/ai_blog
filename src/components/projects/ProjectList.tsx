"use client";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { formatKoreanDate } from "@/lib/utils";
import type { ProjectRecord } from "@/types/project";

interface ProjectListProps {
  projects: ProjectRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  onEdit: (project: ProjectRecord) => void;
  onDelete: (project: ProjectRecord) => void;
  onDuplicate: (project: ProjectRecord) => void;
}

export function ProjectList({
  projects,
  isLoading,
  isSubmitting,
  onEdit,
  onDelete,
  onDuplicate,
}: ProjectListProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <LoadingSpinner size="lg" label="프로젝트 목록을 불러오는 중입니다..." className="py-12" />
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            등록된 프로젝트가 없습니다
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            위 폼에서 프로젝트를 생성하면 블로그 작성·발행·예약을 프로젝트 단위로 관리할 수 있습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">프로젝트 목록</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          총 {projects.length}개의 프로젝트가 등록되어 있습니다.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">이름</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">타겟</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">언어/국가</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">상태</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">생성일</th>
              <th className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {projects.map((item) => (
              <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                  {item.description && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{item.targetAudience || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.language} / {item.country}
                </td>
                <td className="px-6 py-4">
                  <ProjectStatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatKoreanDate(item.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={isSubmitting}
                      onClick={() => onEdit(item)}
                    >
                      수정
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={isSubmitting}
                      onClick={() => onDuplicate(item)}
                    >
                      복제
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400"
                      disabled={isSubmitting}
                      onClick={() => onDelete(item)}
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
    </section>
  );
}
