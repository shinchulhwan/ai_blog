"use client";

import { useCallback, useRef, useState } from "react";
import type { GenerateBlogResponse } from "@/types/blog";
import { API_ROUTES } from "@/config/app.config";
import {
  blogFullResponseSchema,
  type BlogFullResponse,
} from "@/lib/schemas/blog-response.schema";
import { AI_CONFIG } from "@/config/ai.config";
import { parseJsonResponseSafe } from "@/lib/http/parse-json-response";
import {
  DEFAULT_BLOG_WRITING_STYLE,
  type BlogWritingStyle,
} from "@/types/blog-style";
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
  publishUrl?: string | null;
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
  publishUrl: string | null;
  writingStyle: BlogWritingStyle | null;
  generate: (keyword: string, projectId: string, writingStyle?: BlogWritingStyle) => Promise<void>;
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
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [writingStyle, setWritingStyle] = useState<BlogWritingStyle | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const pollingActiveRef = useRef(false);
  const lastPollStateRef = useRef<{ progress: JobProgress; label: string } | null>(
    null,
  );

  const stopPolling = useCallback(() => {
    pollingActiveRef.current = false;

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

    if (job.publishUrl) {
      setPublishUrl(job.publishUrl);
    }
  }, []);

  const pollJobProgress = useCallback(
    (jobId: string) => {
      stopPolling();
      pollingActiveRef.current = true;

      const pollOnce = async () => {
        if (!pollingActiveRef.current) {
          return;
        }

        try {
          const response = await fetch(`${API_ROUTES.jobs}/${jobId}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            return;
          }

          const data = await parseJsonResponseSafe<
            ApiSuccessResponse<GenerationJobRecord>
          >(response);

          if (!data?.success || !data.data) {
            return;
          }

          applyJobProgress(data.data);
        } catch {
          // Long-running execute can starve the dev server briefly; ignore transient poll errors.
        }
      };

      void pollOnce();
      pollTimerRef.current = window.setInterval(() => {
        void pollOnce();
      }, POLL_INTERVAL_MS);
    },
    [applyJobProgress, stopPolling],
  );

  const generate = useCallback(
    async (inputKeyword: string, projectId: string, style: BlogWritingStyle = DEFAULT_BLOG_WRITING_STYLE) => {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);
      setKeyword(inputKeyword);
      setWritingStyle(style);
      setJobProgress(0);
      setPublishUrl(null);
      setJobStatusLabel("🤖 AI 글 생성 중...");

      try {
        const createResponse = await fetch(API_ROUTES.jobs, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: inputKeyword, projectId, writingStyle: style }),
        });

        const createData = await parseJsonResponseSafe<
          ApiSuccessResponse<GenerationJobRecord> | ApiErrorResponse
        >(createResponse);

        if (!createResponse.ok || !createData || !("data" in createData)) {
          throw new Error(parseApiError(createData, "생성 작업을 시작하지 못했습니다."));
        }

        const job = createData.data;

        pollJobProgress(job.id);

        const executeResponse = await fetch(`${API_ROUTES.jobs}/${job.id}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ writingStyle: style }),
        });

        stopPolling();

        const executeData = await parseJsonResponseSafe<
          ApiSuccessResponse<ExecuteSuccessData> | ApiErrorResponse
        >(executeResponse);

        if (!executeResponse.ok || !executeData || !("data" in executeData)) {
          throw new Error(parseApiError(executeData, "블로그 글 생성에 실패했습니다."));
        }

        const executeResult = executeData.data;
        const parsed = blogFullResponseSchema.safeParse(executeResult.result);

        if (!parsed.success) {
          throw new Error("블로그 글 데이터 형식이 올바르지 않습니다.");
        }

        const resolvedPublishUrl = executeResult.publishUrl?.trim() || null;

        setJobProgress(100);
        setPublishUrl(resolvedPublishUrl);
        setJobStatusLabel(
          resolvedPublishUrl ? "✅ 완료 — 발행됨" : "✅ 완료",
        );
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
    [pollJobProgress, stopPolling],
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

      const data = await parseJsonResponseSafe<ApiSuccessResponse | ApiErrorResponse>(
        response,
      );

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
    setPublishUrl(null);
    setWritingStyle(null);
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
    publishUrl,
    writingStyle,
    generate,
    saveMarkdown,
    clearError,
    reset,
  };
}
