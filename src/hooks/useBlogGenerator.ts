"use client";

import { useCallback, useRef, useState } from "react";
import type { GenerateBlogResponse } from "@/types/blog";
import { API_ROUTES } from "@/config/app.config";
import {
  blogFullResponseSchema,
  type BlogFullResponse,
} from "@/lib/schemas/blog-response.schema";
import { AI_CONFIG } from "@/config/ai.config";
import {
  JOB_PROGRESS_LABELS,
  JOB_STATUS_LABELS,
  type GenerationJobRecord,
  type JobProgress,
  type JobStatus,
} from "@/types/job";

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface ExecuteSuccessData {
  jobId: string;
  historyId: string;
  result: BlogFullResponse;
}

interface UseBlogGeneratorReturn {
  blog: GenerateBlogResponse | null;
  fullBlog: BlogFullResponse | null;
  isLoading: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  error: string | null;
  keyword: string | null;
  jobProgress: JobProgress;
  jobStatusLabel: string | null;
  generate: (keyword: string, projectId: string) => Promise<void>;
  saveMarkdown: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const POLL_INTERVAL_MS = 1000;

function mapToUiBlog(result: BlogFullResponse): GenerateBlogResponse {
  return {
    title: result.selectedTitle,
    description: result.metaDescription,
    content: result.content,
    hashtags: result.hashtags,
    provider: "openai",
    model: AI_CONFIG.providers.openai.model,
  };
}

function getJobDisplayLabel(job: GenerationJobRecord): string {
  if (job.currentStepLabel) {
    return job.currentStepLabel;
  }

  return JOB_PROGRESS_LABELS[job.progress] ?? JOB_STATUS_LABELS[job.status as JobStatus];
}

function parseApiError(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    (data as ApiErrorResponse).success === false
  ) {
    return (data as ApiErrorResponse).error ?? fallback;
  }

  return fallback;
}

export function useBlogGenerator(): UseBlogGeneratorReturn {
  const [blog, setBlog] = useState<GenerateBlogResponse | null>(null);
  const [fullBlog, setFullBlog] = useState<BlogFullResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress>(0);
  const [jobStatusLabel, setJobStatusLabel] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const lastPollStateRef = useRef<{ progress: JobProgress; label: string } | null>(
    null,
  );

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    lastPollStateRef.current = null;
  }, []);

  const applyJobProgress = useCallback((job: GenerationJobRecord) => {
    const label = getJobDisplayLabel(job);
    const prev = lastPollStateRef.current;

    if (prev?.progress === job.progress && prev.label === label) {
      return;
    }

    lastPollStateRef.current = { progress: job.progress, label };
    setJobProgress(job.progress);
    setJobStatusLabel(label);
  }, []);

  const pollJob = useCallback(
    (jobId: string) =>
      new Promise<GenerationJobRecord>((resolve, reject) => {
        stopPolling();

        const poll = async () => {
          try {
            const response = await fetch(`${API_ROUTES.jobs}/${jobId}`);

            if (!response.ok) {
              const data: unknown = await response.json().catch(() => null);
              throw new Error(parseApiError(data, "작업 상태를 불러오지 못했습니다."));
            }

            const data = (await response.json()) as ApiSuccessResponse<GenerationJobRecord>;
            const job = data.data;

            applyJobProgress(job);

            if (job.status === "COMPLETED") {
              stopPolling();
              resolve(job);
              return;
            }

            if (job.status === "FAILED") {
              stopPolling();
              reject(new Error(job.errorMessage ?? "블로그 글 생성에 실패했습니다."));
            }
          } catch (err) {
            stopPolling();

            if (err instanceof TypeError) {
              reject(new Error("네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요."));
              return;
            }

            reject(err instanceof Error ? err : new Error("작업 상태를 불러오지 못했습니다."));
          }
        };

        void poll();
        pollTimerRef.current = window.setInterval(() => {
          void poll();
        }, POLL_INTERVAL_MS);
      }),
    [applyJobProgress, stopPolling],
  );

  const generate = useCallback(
    async (inputKeyword: string, projectId: string) => {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);
      setKeyword(inputKeyword);
      setJobProgress(0);
      setJobStatusLabel(JOB_STATUS_LABELS.PENDING);

      try {
        const createResponse = await fetch(API_ROUTES.jobs, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: inputKeyword, projectId }),
        });

        const createData: unknown = await createResponse.json().catch(() => null);

        if (!createResponse.ok) {
          throw new Error(parseApiError(createData, "생성 작업을 시작하지 못했습니다."));
        }

        const job = (createData as ApiSuccessResponse<GenerationJobRecord>).data;

        const executePromise = fetch(`${API_ROUTES.jobs}/${job.id}/execute`, {
          method: "POST",
        }).then(async (response) => {
          const data: unknown = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(parseApiError(data, "블로그 글 생성에 실패했습니다."));
          }

          return (data as ApiSuccessResponse<ExecuteSuccessData>).data;
        });

        const [, executeResult] = await Promise.all([
          pollJob(job.id),
          executePromise,
        ]);

        const parsed = blogFullResponseSchema.safeParse(executeResult.result);

        if (!parsed.success) {
          throw new Error("블로그 글 데이터 형식이 올바르지 않습니다.");
        }

        setJobProgress(100);
        setJobStatusLabel("✅ 완료");
        setFullBlog(parsed.data);
        setBlog(mapToUiBlog(parsed.data));
      } catch (err) {
        if (err instanceof TypeError) {
          setError("네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.");
        } else {
          setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
        }
        setBlog(null);
        setFullBlog(null);
      } finally {
        stopPolling();
        setIsLoading(false);
      }
    },
    [pollJob, stopPolling],
  );

  const saveMarkdown = useCallback(async () => {
    if (!fullBlog || !keyword) {
      setError("저장할 블로그 글이 없습니다.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(API_ROUTES.saveBlog, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, blog: fullBlog }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(parseApiError(data, "Markdown 저장에 실패했습니다."));
      }

      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof TypeError) {
        setError("네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.");
      } else {
        setError(err instanceof Error ? err.message : "Markdown 저장에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [fullBlog, keyword]);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    stopPolling();
    setBlog(null);
    setFullBlog(null);
    setError(null);
    setKeyword(null);
    setIsLoading(false);
    setIsSaving(false);
    setSaveSuccess(false);
    setJobProgress(0);
    setJobStatusLabel(null);
  }, [stopPolling]);

  return {
    blog,
    fullBlog,
    isLoading,
    isSaving,
    saveSuccess,
    error,
    keyword,
    jobProgress,
    jobStatusLabel,
    generate,
    saveMarkdown,
    clearError,
    reset,
  };
}
