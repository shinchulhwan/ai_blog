"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatFileSize } from "@/lib/photo/format";
import type { PhotoAssetRecord } from "@/types/photo";
import { cn } from "@/lib/utils";

interface PhotoGridProps {
  photos: PhotoAssetRecord[];
  onDelete: (photoId: string) => Promise<boolean>;
  onReorder: (photoIds: string[]) => Promise<boolean>;
  isDeleting?: boolean;
  isReordering?: boolean;
}

export function PhotoGrid({
  photos,
  onDelete,
  onReorder,
  isDeleting = false,
  isReordering = false,
}: PhotoGridProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const movePhoto = useCallback(
    async (sourceId: string, targetId: string) => {
      if (sourceId === targetId) return;

      const currentIds = photos.map((photo) => photo.id);
      const sourceIndex = currentIds.indexOf(sourceId);
      const targetIndex = currentIds.indexOf(targetId);

      if (sourceIndex < 0 || targetIndex < 0) return;

      const nextIds = [...currentIds];
      const [moved] = nextIds.splice(sourceIndex, 1);
      nextIds.splice(targetIndex, 0, moved);

      await onReorder(nextIds);
    },
    [onReorder, photos],
  );

  async function handleDelete(photo: PhotoAssetRecord) {
    const confirmed = window.confirm(`"${photo.originalName}" 사진을 삭제하시겠습니까?`);
    if (!confirmed) return;
    await onDelete(photo.id);
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          아직 업로드된 사진이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {photos.length}장 · 드래그하여 순서 변경
        </p>
        {isReordering && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400">정렬 저장 중...</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo, index) => (
          <article
            key={photo.id}
            draggable={!isDeleting && !isReordering}
            onDragStart={() => setDraggingId(photo.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (draggingId && draggingId !== photo.id) {
                setDragOverId(photo.id);
              }
            }}
            onDragLeave={() => {
              if (dragOverId === photo.id) setDragOverId(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingId) {
                void movePhoto(draggingId, photo.id);
              }
              setDraggingId(null);
              setDragOverId(null);
            }}
            className={cn(
              "group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all dark:bg-slate-900",
              dragOverId === photo.id
                ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800"
                : "border-slate-200 dark:border-slate-700",
              draggingId === photo.id && "opacity-50",
            )}
          >
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.originalName}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                {index + 1}
              </span>
            </div>

            <div className="space-y-1 p-3">
              <p
                className="truncate text-xs font-medium text-slate-800 dark:text-slate-200"
                title={photo.originalName}
              >
                {photo.originalName}
              </p>
              <p
                className="truncate text-xs text-slate-500 dark:text-slate-400"
                title={photo.storedName}
              >
                → {photo.storedName}
              </p>
              <p className="text-xs text-slate-400">{formatFileSize(photo.fileSize)}</p>
            </div>

            <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 bg-white/95 px-2 text-xs shadow-sm dark:bg-slate-900/95"
                disabled={isDeleting}
                onClick={() => void handleDelete(photo)}
              >
                삭제
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
