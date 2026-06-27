"use client";

import { useCallback, useEffect, useState } from "react";
import { API_ROUTES } from "@/config/app.config";
import type {
  CreateKeywordInput,
  KeywordRecord,
  KeywordStatus,
  UpdateKeywordInput,
} from "@/types/keyword";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface UseKeywordsReturn {
  keywords: KeywordRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchKeywords: () => Promise<void>;
  createKeyword: (input: CreateKeywordInput) => Promise<boolean>;
  updateKeyword: (id: string, input: UpdateKeywordInput) => Promise<boolean>;
  deleteKeyword: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useKeywords(): UseKeywordsReturn {
  const [keywords, setKeywords] = useState<KeywordRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.keywords);
      const data: unknown = await response.json();

      if (
        !response.ok ||
        (typeof data === "object" &&
          data !== null &&
          "success" in data &&
          (data as ApiErrorResponse).success === false)
      ) {
        throw new Error(
          (data as ApiErrorResponse).error ?? "키워드 목록을 불러오지 못했습니다.",
        );
      }

      setKeywords((data as ApiSuccessResponse<KeywordRecord[]>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "키워드 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeywords();
  }, [fetchKeywords]);

  const createKeyword = useCallback(
    async (input: CreateKeywordInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.keywords, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
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
            (data as ApiErrorResponse).error ?? "키워드를 추가하지 못했습니다.",
          );
        }

        await fetchKeywords();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "키워드를 추가하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchKeywords],
  );

  const updateKeyword = useCallback(
    async (id: string, input: UpdateKeywordInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.keywords}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
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
            (data as ApiErrorResponse).error ?? "키워드를 수정하지 못했습니다.",
          );
        }

        await fetchKeywords();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "키워드를 수정하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchKeywords],
  );

  const deleteKeyword = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.keywords}/${id}`, {
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
            (data as ApiErrorResponse).error ?? "키워드를 삭제하지 못했습니다.",
          );
        }

        await fetchKeywords();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "키워드를 삭제하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchKeywords],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    keywords,
    isLoading,
    isSubmitting,
    error,
    fetchKeywords,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    clearError,
  };
}

export type { KeywordStatus };
