"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PhotoAssetRecord,
  PhotoLibraryRecord,
} from "@/types/photo";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface LibraryResponse {
  library: PhotoLibraryRecord;
  photos: PhotoAssetRecord[];
}

interface UsePhotoLibraryReturn {
  library: PhotoLibraryRecord | null;
  photos: PhotoAssetRecord[];
  isLoading: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  isReordering: boolean;
  error: string | null;
  fetchLibrary: () => Promise<void>;
  uploadPhotos: (files: File[]) => Promise<boolean>;
  deletePhoto: (photoId: string) => Promise<boolean>;
  reorderPhotos: (photoIds: string[]) => Promise<boolean>;
  clearError: () => void;
}

function photosApiPath(projectId: string): string {
  return `/api/projects/${projectId}/photos`;
}

export function usePhotoLibrary(projectId: string | null): UsePhotoLibraryReturn {
  const [library, setLibrary] = useState<PhotoLibraryRecord | null>(null);
  const [photos, setPhotos] = useState<PhotoAssetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLibrary = useCallback(async () => {
    if (!projectId) {
      setLibrary(null);
      setPhotos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(photosApiPath(projectId));
      const data: unknown = await response.json();

      if (
        !response.ok ||
        (typeof data === "object" &&
          data !== null &&
          "success" in data &&
          (data as ApiErrorResponse).success === false)
      ) {
        throw new Error(
          (data as ApiErrorResponse).error ?? "Photo Library를 불러오지 못했습니다.",
        );
      }

      const payload = (data as ApiSuccessResponse<LibraryResponse>).data;
      setLibrary(payload.library);
      setPhotos(payload.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo Library를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchLibrary();
  }, [fetchLibrary]);

  const uploadPhotos = useCallback(
    async (files: File[]) => {
      if (!projectId || files.length === 0) return false;

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file);
        }

        const response = await fetch(photosApiPath(projectId), {
          method: "POST",
          body: formData,
        });

        const data: unknown = await response.json();

        if (
          !response.ok ||
          (typeof data === "object" &&
            data !== null &&
            "success" in data &&
            (data as ApiErrorResponse).success === false)
        ) {
          throw new Error(
            (data as ApiErrorResponse).error ?? "이미지 업로드에 실패했습니다.",
          );
        }

        await fetchLibrary();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [projectId, fetchLibrary],
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      if (!projectId) return false;

      setIsDeleting(true);
      setError(null);

      try {
        const response = await fetch(`${photosApiPath(projectId)}/${photoId}`, {
          method: "DELETE",
        });

        const data: unknown = await response.json();

        if (
          !response.ok ||
          (typeof data === "object" &&
            data !== null &&
            "success" in data &&
            (data as ApiErrorResponse).success === false)
        ) {
          throw new Error(
            (data as ApiErrorResponse).error ?? "사진 삭제에 실패했습니다.",
          );
        }

        setPhotos((current) => current.filter((photo) => photo.id !== photoId));
        setLibrary((current) =>
          current
            ? { ...current, photoCount: Math.max(0, current.photoCount - 1) }
            : current,
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "사진 삭제에 실패했습니다.");
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [projectId],
  );

  const reorderPhotos = useCallback(
    async (photoIds: string[]) => {
      if (!projectId) return false;

      setIsReordering(true);
      setError(null);

      const previous = photos;

      const reordered = photoIds
        .map((id) => photos.find((photo) => photo.id === id))
        .filter((photo): photo is PhotoAssetRecord => photo !== undefined);

      setPhotos(reordered);

      try {
        const response = await fetch(`${photosApiPath(projectId)}/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoIds }),
        });

        const data: unknown = await response.json();

        if (
          !response.ok ||
          (typeof data === "object" &&
            data !== null &&
            "success" in data &&
            (data as ApiErrorResponse).success === false)
        ) {
          throw new Error(
            (data as ApiErrorResponse).error ?? "사진 정렬에 실패했습니다.",
          );
        }

        setPhotos((data as ApiSuccessResponse<PhotoAssetRecord[]>).data);
        return true;
      } catch (err) {
        setPhotos(previous);
        setError(err instanceof Error ? err.message : "사진 정렬에 실패했습니다.");
        return false;
      } finally {
        setIsReordering(false);
      }
    },
    [projectId, photos],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    library,
    photos,
    isLoading,
    isUploading,
    isDeleting,
    isReordering,
    error,
    fetchLibrary,
    uploadPhotos,
    deletePhoto,
    reorderPhotos,
    clearError,
  };
}
