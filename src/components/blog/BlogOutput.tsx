"use client";

import type { ReactNode } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { JobProgressBar } from "@/components/ui/JobProgressBar";
import type { JobProgress } from "@/types/job";
import { BLOG_WRITING_STYLE_LABELS, type BlogWritingStyle } from "@/types/blog-style";
import type { GenerateBlogResponse } from "@/types/blog";

interface BlogOutputProps {
  blog: GenerateBlogResponse | null;
  isLoading: boolean;
  keyword?: string;
  jobProgress?: JobProgress;
  jobStatusLabel?: string;
  publishUrl?: string;
  writingStyle?: BlogWritingStyle;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (blockIndex: number) => {
    if (listItems.length === 0) return;

    blocks.push(
      <ul
        key={`list-${blockIndex}`}
        className="ml-4 list-disc space-y-1"
      >
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

export function BlogOutput({
  blog,
  isLoading,
  keyword,
  jobProgress = 0,
  jobStatusLabel,
  publishUrl,
  writingStyle,
}: BlogOutputProps) {
  if (isLoading) {
    const label =
      jobStatusLabel ??
      `"${keyword ?? "입력한 주제"}"에 대한 블로그 글을 작성하고 있습니다...`;

    return (
      <section
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        aria-busy="true"
        aria-label="블로그 글 생성 중"
      >
        <LoadingSpinner size="lg" label={label} className="py-16" />
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 pb-4">
          <JobProgressBar progress={jobProgress} />
        </div>
      </section>
    );
  }

  if (!blog) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <div className="mx-auto max-w-md">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          >
            <svg
              className="h-6 w-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            생성 결과
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            키워드를 입력하고 블로그 생성 버튼을 누르면 AI가 작성한 글이
            여기에 표시됩니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      aria-label="생성된 블로그 글"
    >
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {blog.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {writingStyle && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {BLOG_WRITING_STYLE_LABELS[writingStyle]}
              </span>
            )}
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {blog.provider}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              {blog.model}
            </span>
          </div>
        </div>
        {blog.hashtags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {blog.hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
        {publishUrl ? (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              네이버 발행 완료
            </p>
            <a
              href={publishUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block break-all text-sm font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
            >
              {publishUrl}
            </a>
          </div>
        ) : null}
      </div>
      <div className="max-h-[600px] overflow-y-auto px-6 py-6">
        <MarkdownContent content={blog.content} />
      </div>
    </section>
  );
}
