"use client";

import { useCallback, useEffect, useState } from "react";
import { API_ROUTES } from "@/config/app.config";
import type {
  CreateProjectInput,
  ProjectRecord,
  ProjectStatus,
  UpdateProjectInput,
} from "@/types/project";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

interface UseProjectsReturn {
  projects: ProjectRecord[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<boolean>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  duplicateProject: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.projects);
      const data: unknown = await response.json();

      if (
        !response.ok ||
        (typeof data === "object" &&
          data !== null &&
          "success" in data &&
          (data as ApiErrorResponse).success === false)
      ) {
        throw new Error(
          (data as ApiErrorResponse).error ?? "프로젝트 목록을 불러오지 못했습니다.",
        );
      }

      setProjects((data as ApiSuccessResponse<ProjectRecord[]>).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "프로젝트 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.projects, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
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
            (data as ApiErrorResponse).error ?? "프로젝트를 생성하지 못했습니다.",
          );
        }

        await fetchProjects();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로젝트를 생성하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchProjects],
  );

  const updateProject = useCallback(
    async (id: string, input: UpdateProjectInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.projects}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
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
            (data as ApiErrorResponse).error ?? "프로젝트를 수정하지 못했습니다.",
          );
        }

        await fetchProjects();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로젝트를 수정하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchProjects],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.projects}/${id}`, {
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
            (data as ApiErrorResponse).error ?? "프로젝트를 삭제하지 못했습니다.",
          );
        }

        await fetchProjects();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로젝트를 삭제하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchProjects],
  );

  const duplicateProject = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${API_ROUTES.projects}/${id}/duplicate`, {
          method: "POST",
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
            (data as ApiErrorResponse).error ?? "프로젝트를 복제하지 못했습니다.",
          );
        }

        await fetchProjects();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "프로젝트를 복제하지 못했습니다.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchProjects],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    projects,
    isLoading,
    isSubmitting,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    clearError,
  };
}

export type { ProjectStatus };
