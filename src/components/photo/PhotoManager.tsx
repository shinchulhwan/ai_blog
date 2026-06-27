"use client";

import { useEffect, useState } from "react";
import { PhotoDropZone } from "@/components/photo/PhotoDropZone";
import { PhotoGrid } from "@/components/photo/PhotoGrid";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { usePhotoLibrary } from "@/hooks/usePhotoLibrary";
import { useProjects } from "@/hooks/useProjects";

export function PhotoManager() {
  const { projects, isLoading: isProjectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const {
    library,
    photos,
    isLoading,
    isUploading,
    isDeleting,
    isReordering,
    error,
    uploadPhotos,
    deletePhoto,
    reorderPhotos,
    clearError,
  } = usePhotoLibrary(selectedProjectId);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      const active = projects.find((project) => project.status === "ACTIVE") ?? projects[0];
      setSelectedProjectId(active.id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Photo Library
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              프로젝트별로 이미지를 업로드·관리합니다. 업로드 시 파일명이 자동으로 변경됩니다.
            </p>
          </div>

          <div className="min-w-[220px]">
            <label
              htmlFor="photo-project-select"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              프로젝트
            </label>
            <select
              id="photo-project-select"
              value={selectedProjectId ?? ""}
              onChange={(event) => setSelectedProjectId(event.target.value || null)}
              disabled={isProjectsLoading || projects.length === 0}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900"
            >
              {projects.length === 0 ? (
                <option value="">프로젝트 없음</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {isProjectsLoading ? (
          <LoadingSpinner label="프로젝트 불러오는 중..." />
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            먼저 프로젝트를 생성한 후 Photo Library를 사용할 수 있습니다.
          </p>
        ) : (
          <>
            {selectedProject && library && (
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedProject.name}
                </span>
                {" · "}
                {library.photoCount}장 저장됨
              </p>
            )}

            <PhotoDropZone
              onFilesSelected={(files) => void uploadPhotos(files)}
              isUploading={isUploading}
              disabled={!selectedProjectId}
            />
          </>
        )}
      </section>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {selectedProjectId && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            업로드된 사진
          </h3>

          {isLoading ? (
            <LoadingSpinner label="사진 불러오는 중..." />
          ) : (
            <PhotoGrid
              photos={photos}
              onDelete={deletePhoto}
              onReorder={reorderPhotos}
              isDeleting={isDeleting}
              isReordering={isReordering}
            />
          )}
        </section>
      )}
    </div>
  );
}
