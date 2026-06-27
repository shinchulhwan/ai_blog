"use client";

import { useState } from "react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectList } from "@/components/projects/ProjectList";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useProjects } from "@/hooks/useProjects";
import type {
  CreateProjectInput,
  ProjectRecord,
  UpdateProjectInput,
} from "@/types/project";

export function ProjectManager() {
  const {
    projects,
    isLoading,
    isSubmitting,
    error,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    clearError,
  } = useProjects();

  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);

  async function handleSubmit(
    input: CreateProjectInput | UpdateProjectInput,
  ): Promise<boolean> {
    if (editingProject) {
      const success = await updateProject(editingProject.id, input);
      if (success) {
        setEditingProject(null);
      }
      return success;
    }

    return createProject(input as CreateProjectInput);
  }

  async function handleDelete(project: ProjectRecord) {
    const confirmed = window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?`);

    if (!confirmed) return;

    const success = await deleteProject(project.id);

    if (success && editingProject?.id === project.id) {
      setEditingProject(null);
    }
  }

  async function handleDuplicate(project: ProjectRecord) {
    await duplicateProject(project.id);
  }

  return (
    <div className="space-y-6">
      <ProjectForm
        editingProject={editingProject}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditingProject(null)}
      />

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onEdit={setEditingProject}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}
