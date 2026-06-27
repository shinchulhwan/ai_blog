"use client";

import { BlogGeneratorForm } from "@/components/blog/BlogGeneratorForm";
import { BlogOutput } from "@/components/blog/BlogOutput";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useBlogGenerator } from "@/hooks/useBlogGenerator";

export function BlogGenerator() {
  const { blog, isLoading, isSaving, saveSuccess, error, keyword, jobProgress, jobStatusLabel, publishUrl, writingStyle, generate, saveMarkdown, clearError } =
    useBlogGenerator();

  return (
    <div className="space-y-6">
      <BlogGeneratorForm
        onGenerate={generate}
        onSaveMarkdown={saveMarkdown}
        isLoading={isLoading}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        canSaveMarkdown={!!blog}
      />

      {error && (
        <ErrorMessage message={error} onDismiss={clearError} />
      )}

      <BlogOutput
        blog={blog}
        isLoading={isLoading}
        keyword={keyword ?? undefined}
        jobProgress={jobProgress}
        jobStatusLabel={jobStatusLabel ?? undefined}
        publishUrl={publishUrl ?? undefined}
        writingStyle={writingStyle ?? undefined}
      />
    </div>
  );
}
