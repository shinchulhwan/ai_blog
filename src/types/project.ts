export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  language: string;
  country: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPromptRecord {
  id: string;
  projectId: string;
  name: string;
  description: string;
  systemInstructions: string;
  userTemplate: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectKnowledgeRecord {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  targetAudience?: string;
  language?: string;
  country?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  targetAudience?: string;
  language?: string;
  country?: string;
  status?: ProjectStatus;
}

export interface ProjectFilter {
  status?: ProjectStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "활성",
  ARCHIVED: "보관",
};

export const DEFAULT_PROJECT_ID = "proj_default0000000001";
