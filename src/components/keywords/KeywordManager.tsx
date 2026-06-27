"use client";

import { useState } from "react";
import { KeywordForm } from "@/components/keywords/KeywordForm";
import { KeywordList } from "@/components/keywords/KeywordList";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useKeywords } from "@/hooks/useKeywords";
import type {
  CreateKeywordInput,
  KeywordRecord,
  UpdateKeywordInput,
} from "@/types/keyword";

export function KeywordManager() {
  const {
    keywords,
    isLoading,
    isSubmitting,
    error,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    clearError,
  } = useKeywords();

  const [editingKeyword, setEditingKeyword] = useState<KeywordRecord | null>(null);

  async function handleSubmit(
    input: CreateKeywordInput | UpdateKeywordInput,
  ): Promise<boolean> {
    if (editingKeyword) {
      const success = await updateKeyword(editingKeyword.id, input);
      if (success) {
        setEditingKeyword(null);
      }
      return success;
    }

    return createKeyword(input as CreateKeywordInput);
  }

  async function handleDelete(keyword: KeywordRecord) {
    const confirmed = window.confirm(
      `"${keyword.keyword}" 키워드를 삭제하시겠습니까?`,
    );

    if (!confirmed) return;

    const success = await deleteKeyword(keyword.id);

    if (success && editingKeyword?.id === keyword.id) {
      setEditingKeyword(null);
    }
  }

  return (
    <div className="space-y-6">
      <KeywordForm
        editingKeyword={editingKeyword}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingKeyword(null)}
      />

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <KeywordList
        keywords={keywords}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEdit={setEditingKeyword}
        onDelete={handleDelete}
      />
    </div>
  );
}
