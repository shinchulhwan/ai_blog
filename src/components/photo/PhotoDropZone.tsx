"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  collectFilesFromDataTransfer,
  collectFilesFromFileList,
} from "@/lib/photo/collect-files";
import { cn } from "@/lib/utils";

interface PhotoDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function PhotoDropZone({
  onFilesSelected,
  isUploading = false,
  disabled = false,
}: PhotoDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0 || disabled || isUploading) return;
      onFilesSelected(files);
    },
    [disabled, isUploading, onFilesSelected],
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = await collectFilesFromDataTransfer(event.dataTransfer);
      handleFiles(files);
    },
    [disabled, handleFiles, isUploading],
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !isUploading) fileInputRef.current?.click();
        }}
        className={cn(
          "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-800/50",
          (disabled || isUploading) && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="mb-3 text-3xl" aria-hidden="true">
          📷
        </div>
        <p className="text-base font-medium text-slate-900 dark:text-slate-100">
          {isUploading ? "업로드 중..." : "이미지를 드래그하거나 클릭하여 업로드"}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          JPG, PNG, WEBP · 여러 장 · 폴더 선택 지원 · 파일당 최대 10MB
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          이미지 선택
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => folderInputRef.current?.click()}
        >
          폴더 선택
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={(event) => {
          if (!event.target.files) return;
          handleFiles(collectFilesFromFileList(event.target.files));
          event.target.value = "";
        }}
      />

      <input
        ref={folderInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={(event) => {
          if (!event.target.files) return;
          handleFiles(collectFilesFromFileList(event.target.files));
          event.target.value = "";
        }}
      />
    </div>
  );
}
