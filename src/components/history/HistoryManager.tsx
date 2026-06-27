"use client";

import { type FormEvent } from "react";
import { HistoryDetail } from "@/components/history/HistoryDetail";
import { HistoryList } from "@/components/history/HistoryList";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { useBlogHistory } from "@/hooks/useBlogHistory";
import type { BlogHistoryListItem } from "@/types/history";

export function HistoryManager() {
  const {
    histories,
    selectedHistory,
    isLoading,
    isDetailLoading,
    isSubmitting,
    regeneratingId,
    error,
    searchQuery,
    setSearchQuery,
    fetchHistories,
    fetchDetail,
    clearDetail,
    deleteHistory,
    regenerateHistory,
    clearError,
  } = useBlogHistory();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void fetchHistories(searchQuery);
  }

  function handleViewDetail(item: BlogHistoryListItem) {
    void fetchDetail(item.id);
  }

  async function handleDelete(item: BlogHistoryListItem) {
    const confirmed = window.confirm(
      `"${item.selectedTitle}" 생성 이력을 삭제하시겠습니까?`,
    );

    if (!confirmed) return;

    await deleteHistory(item.id);
  }

  async function handleRegenerate(item: BlogHistoryListItem) {
    const confirmed = window.confirm(
      `"${item.keyword}" 키워드로 블로그 글을 다시 생성하시겠습니까?`,
    );

    if (!confirmed) return;

    await regenerateHistory(item.id);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            생성 이력 검색
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            키워드 또는 제목으로 생성 이력을 검색할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="검색어"
              name="search"
              placeholder="키워드 또는 제목을 입력하세요."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto sm:shrink-0">
            검색
          </Button>
        </div>
      </form>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <HistoryList
        histories={histories}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        regeneratingId={regeneratingId}
        selectedId={selectedHistory?.id ?? null}
        onViewDetail={handleViewDetail}
        onDelete={handleDelete}
        onRegenerate={handleRegenerate}
      />

      {(selectedHistory || isDetailLoading) && (
        <HistoryDetail
          history={selectedHistory}
          isLoading={isDetailLoading}
          onClose={clearDetail}
        />
      )}
    </div>
  );
}
