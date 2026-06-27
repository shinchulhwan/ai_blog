"use client";

import { useCallback, useEffect, useState } from "react";
import { API_ROUTES } from "@/config/app.config";
import type { BlogHistoryListItem, BlogHistoryRecord } from "@/types/history";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface UseBlogHistoryReturn {
  histories: BlogHistoryListItem[];
  selectedHistory: BlogHistoryRecord | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  isSubmitting: boolean;
  regeneratingId: string | null;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  fetchHistories: (search?: string) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  clearDetail: () => void;
  deleteHistory: (id: string) => Promise<boolean>;
  regenerateHistory: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useBlogHistory(): UseBlogHistoryReturn {
  const [histories, setHistories] = useState<BlogHistoryListItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<BlogHistoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistories = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      const query = search?.trim();
      if (query) params.set("search", query);

      const url = params.toString()
        ? `${API_ROUTES.history}?${params.toString()}`
        : API_ROUTES.history;

      const response = await fetch(url);
      const data: unknown = await response.json();

      if (
        !response.ok ||
        (typeof data === "object" &&
          data !== null &&
          "success" in data &&
          (data as ApiErrorResponse).success === false)
      ) {
        throw new Error(
          (data as ApiErrorResponse).error ?? "생성 이력을 불러오지 못했습니다.",
        );
      }

      setHistories((data as ApiSuccessResponse<BlogHistoryListItem[]>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 이력을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  const fetchDetail = useCallback(async (id: string) => {
    setIsDetailLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_ROUTES.history}/${id}`);
      const data: unknown = await response.json();

      if (
        !response.ok ||
        (typeof data === "object" &&
          data !== null &&
          "success" in data &&
          (data as ApiErrorResponse).success === false)
      ) {
        throw new Error(
          (data as ApiErrorResponse).error ?? "상세 정보를 불러오지 못했습니다.",
        );
      }

      setSelectedHistory((data as ApiSuccessResponse<BlogHistoryRecord>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const clearDetail = useCallback(() => setSelectedHistory(null), []);

  const deleteHistory = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.history}/${id}`, {
          method: "DELETE",
        });

        const data: unknown = await response.json();

        if (
          !response.ok ||
          (typeof data === "object" &&
            data !== null &&
            "success" in data &&
            (data as ApiErrorResponse).success === false)
        ) {
          throw new Error(
            (data as ApiErrorResponse).error ?? "생성 이력을 삭제하지 못했습니다.",
          );
        }

        if (selectedHistory?.id === id) {
          setSelectedHistory(null);
        }

        await fetchHistories(searchQuery);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "생성 이력을 삭제하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchHistories, searchQuery, selectedHistory?.id],
  );

  const regenerateHistory = useCallback(
    async (id: string) => {
      setRegeneratingId(id);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.history}/${id}/regenerate`, {
          method: "POST",
        });

        const data: unknown = await response.json();

        if (
          !response.ok ||
          (typeof data === "object" &&
            data !== null &&
            "success" in data &&
            (data as ApiErrorResponse).success === false)
        ) {
          throw new Error(
            (data as ApiErrorResponse).error ?? "블로그 글 재생성에 실패했습니다.",
          );
        }

        const newHistory = (data as ApiSuccessResponse<BlogHistoryRecord>).data;

        await fetchHistories(searchQuery);
        setSelectedHistory(newHistory);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "블로그 글 재생성에 실패했습니다.");
        return false;
      } finally {
        setRegeneratingId(null);
      }
    },
    [fetchHistories, searchQuery],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
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
  };
}
