"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  DEFAULT_KEYWORD_CATEGORIES,
  KEYWORD_STATUS_LABELS,
  type CreateKeywordInput,
  type KeywordRecord,
  type KeywordStatus,
  type UpdateKeywordInput,
} from "@/types/keyword";

interface KeywordFormProps {
  editingKeyword: KeywordRecord | null;
  isSubmitting: boolean;
  onSubmit: (input: CreateKeywordInput | UpdateKeywordInput) => Promise<boolean>;
  onCancelEdit: () => void;
}

const STATUS_OPTIONS: KeywordStatus[] = ["PENDING", "COMPLETED", "FAILED"];

export function KeywordForm({
  editingKeyword,
  isSubmitting,
  onSubmit,
  onCancelEdit,
}: KeywordFormProps) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_KEYWORD_CATEGORIES[0]);
  const [status, setStatus] = useState<KeywordStatus>("PENDING");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (editingKeyword) {
      setKeyword(editingKeyword.keyword);
      setCategory(editingKeyword.category);
      setStatus(editingKeyword.status);
    } else {
      setKeyword("");
      setCategory(DEFAULT_KEYWORD_CATEGORIES[0]);
      setStatus("PENDING");
    }
    setValidationError(null);
  }, [editingKeyword]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedKeyword = keyword.trim();
    const trimmedCategory = category.trim();

    if (!trimmedKeyword) {
      setValidationError("키워드를 입력해 주세요.");
      return;
    }

    if (trimmedKeyword.length < 2) {
      setValidationError("키워드는 2자 이상 입력해 주세요.");
      return;
    }

    if (!trimmedCategory) {
      setValidationError("카테고리를 입력해 주세요.");
      return;
    }

    setValidationError(null);

    const payload = {
      keyword: trimmedKeyword,
      category: trimmedCategory,
      status,
    };

    const success = await onSubmit(payload);

    if (success && !editingKeyword) {
      setKeyword("");
      setCategory(DEFAULT_KEYWORD_CATEGORIES[0]);
      setStatus("PENDING");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {editingKeyword ? "키워드 수정" : "키워드 추가"}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {editingKeyword
            ? "선택한 키워드 정보를 수정합니다."
            : "자동 생성 대기열에 키워드를 등록합니다."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="키워드"
          name="keyword"
          placeholder="블로그 키워드를 입력하세요."
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            if (validationError) setValidationError(null);
          }}
          error={validationError ?? undefined}
          disabled={isSubmitting}
          autoComplete="off"
        />

        <Input
          label="카테고리"
          name="category"
          placeholder="예: 일반, 리뷰, SEO"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={isSubmitting}
          list="keyword-categories"
          autoComplete="off"
        />

        <datalist id="keyword-categories">
          {DEFAULT_KEYWORD_CATEGORIES.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <Select
          label="상태"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as KeywordStatus)}
          disabled={isSubmitting}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {KEYWORD_STATUS_LABELS[option]}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          {editingKeyword ? "수정 저장" : "키워드 추가"}
        </Button>
        {editingKeyword && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancelEdit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            수정 취소
          </Button>
        )}
      </div>
    </form>
  );
}
