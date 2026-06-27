"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useProjects } from "@/hooks/useProjects";
import {
  BLOG_WRITING_STYLE_OPTIONS,
  DEFAULT_BLOG_WRITING_STYLE,
  type BlogWritingStyle,
} from "@/types/blog-style";

interface BlogGeneratorFormProps {
  onGenerate: (keyword: string, projectId: string, writingStyle: BlogWritingStyle) => void;
  onSaveMarkdown?: () => void;
  isLoading: boolean;
  isSaving?: boolean;
  saveSuccess?: boolean;
  canSaveMarkdown?: boolean;
  disabled?: boolean;
}

export function BlogGeneratorForm({
  onGenerate,
  onSaveMarkdown,
  isLoading,
  isSaving = false,
  saveSuccess = false,
  canSaveMarkdown = false,
  disabled = false,
}: BlogGeneratorFormProps) {
  const { projects, isLoading: isProjectsLoading } = useProjects();
  const [projectId, setProjectId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [writingStyle, setWritingStyle] = useState<BlogWritingStyle>(
    DEFAULT_BLOG_WRITING_STYLE,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId && projects.length > 0) {
      const active = projects.find((item) => item.status === "ACTIVE");
      setProjectId(active?.id ?? projects[0].id);
    }
  }, [projects, projectId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = keyword.trim();

    if (!projectId) {
      setValidationError("프로젝트를 선택해 주세요.");
      return;
    }

    if (!trimmed) {
      setValidationError("블로그 키워드를 입력해 주세요.");
      return;
    }

    if (trimmed.length < 2) {
      setValidationError("키워드는 2자 이상 입력해 주세요.");
      return;
    }

    setValidationError(null);
    onGenerate(trimmed, projectId, writingStyle);
  }

  const activeProjects = projects.filter((item) => item.status === "ACTIVE");

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          블로그 글 생성
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          키워드나 주제를 입력하면 AI가 SEO에 최적화된 블로그 글을 작성합니다.
        </p>
      </div>

      <div className="mb-4">
        <Select
          label="프로젝트"
          name="projectId"
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isLoading || disabled || isProjectsLoading || activeProjects.length === 0}
          error={
            activeProjects.length === 0 && !isProjectsLoading
              ? "활성 프로젝트가 없습니다. 프로젝트를 먼저 생성해 주세요."
              : undefined
          }
        >
          <option value="">프로젝트 선택</option>
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4">
        <Select
          label="글 스타일"
          name="writingStyle"
          value={writingStyle}
          onChange={(event) => {
            setWritingStyle(event.target.value as BlogWritingStyle);
          }}
          disabled={isLoading || disabled}
        >
          {BLOG_WRITING_STYLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} — {option.description}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="블로그 키워드"
            name="keyword"
            placeholder="블로그 키워드를 입력하세요."
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              if (validationError) setValidationError(null);
            }}
            error={validationError ?? undefined}
            disabled={isLoading || disabled}
            autoComplete="off"
          />
        </div>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={disabled || activeProjects.length === 0}
          className="w-full sm:w-auto sm:shrink-0"
        >
          {isLoading ? "AI가 블로그를 작성하는 중입니다..." : "블로그 생성"}
        </Button>
      </div>

      {onSaveMarkdown && (
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveMarkdown}
            isLoading={isSaving}
            disabled={!canSaveMarkdown || isLoading || disabled}
            className="w-full sm:w-auto"
          >
            {isSaving ? "저장 중..." : saveSuccess ? "저장 완료!" : "Markdown 저장"}
          </Button>
        </div>
      )}
    </form>
  );
}
