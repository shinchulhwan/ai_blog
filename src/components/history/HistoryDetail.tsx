"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BlogHistoryStatusBadge } from "@/components/history/BlogHistoryStatusBadge";
import { formatKoreanDate } from "@/lib/utils";
import type { BlogHistoryRecord } from "@/types/history";

interface HistoryDetailProps {
  history: BlogHistoryRecord | null;
  isLoading: boolean;
  onClose: () => void;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (blockIndex: number) => {
    if (listItems.length === 0) return;

    blocks.push(
      <ul key={`list-${blockIndex}`} className="ml-4 list-disc space-y-1">
        {listItems.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
      return;
    }

    flushList(index);

    if (line.startsWith("### ")) {
      blocks.push(
        <h4
          key={`h4-${index}`}
          className="mt-4 text-lg font-medium text-slate-900 dark:text-white"
        >
          {line.slice(4)}
        </h4>,
      );
      return;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h3
          key={`h3-${index}`}
          className="mt-6 text-xl font-semibold text-slate-900 dark:text-white"
        >
          {line.slice(3)}
        </h3>,
      );
      return;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h2
          key={`h2-${index}`}
          className="text-2xl font-bold text-slate-900 dark:text-white"
        >
          {line.slice(2)}
        </h2>,
      );
      return;
    }

    if (line.trim() === "") {
      blocks.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="leading-relaxed">
        {line}
      </p>,
    );
  });

  flushList(lines.length);

  return (
    <div className="prose-blog space-y-3 text-slate-700 dark:text-slate-300">
      {blocks}
    </div>
  );
}

export function HistoryDetail({ history, isLoading, onClose }: HistoryDetailProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <LoadingSpinner size="lg" label="상세 정보를 불러오는 중입니다..." className="py-12" />
      </section>
    );
  }

  if (!history) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              생성 이력 상세
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              키워드: {history.keyword} · {formatKoreanDate(history.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BlogHistoryStatusBadge status={history.status} />
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">제목</h3>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
            {history.selectedTitle}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">본문</h3>
          <div className="mt-3 max-h-[400px] overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <MarkdownContent content={history.content} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">FAQ</h3>
          <div className="mt-3 space-y-4">
            {history.faq.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <p className="font-medium text-slate-900 dark:text-white">
                  Q. {item.question}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">해시태그</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {history.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">SEO 점수</h3>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {history.seoScore}
              <span className="ml-1 text-sm font-normal text-slate-500">/ 100</span>
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              이미지 프롬프트
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {history.imagePrompt}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
