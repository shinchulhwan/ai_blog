"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  PROJECT_STATUS_LABELS,
  type CreateProjectInput,
  type ProjectRecord,
  type ProjectStatus,
  type UpdateProjectInput,
} from "@/types/project";

interface ProjectFormProps {
  editingProject: ProjectRecord | null;
  isSubmitting: boolean;
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => Promise<boolean>;
  onCancelEdit: () => void;
}

const STATUS_OPTIONS: ProjectStatus[] = ["ACTIVE", "ARCHIVED"];

export function ProjectForm({
  editingProject,
  isSubmitting,
  onSubmit,
  onCancelEdit,
}: ProjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [language, setLanguage] = useState("ko");
  const [country, setCountry] = useState("KR");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description);
      setTargetAudience(editingProject.targetAudience);
      setLanguage(editingProject.language);
      setCountry(editingProject.country);
      setStatus(editingProject.status);
    } else {
      setName("");
      setDescription("");
      setTargetAudience("");
      setLanguage("ko");
      setCountry("KR");
      setStatus("ACTIVE");
    }
    setValidationError(null);
  }, [editingProject]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError("프로젝트 이름을 입력해 주세요.");
      return;
    }

    setValidationError(null);

    const payload = {
      name: trimmedName,
      description: description.trim(),
      targetAudience: targetAudience.trim(),
      language: language.trim(),
      country: country.trim(),
      status,
    };

    const success = await onSubmit(payload);
    if (success && !editingProject) {
      setName("");
      setDescription("");
      setTargetAudience("");
      setLanguage("ko");
      setCountry("KR");
      setStatus("ACTIVE");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          {editingProject ? "프로젝트 수정" : "프로젝트 생성"}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          프로젝트 단위로 블로그 생성·발행·예약을 관리합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="프로젝트 이름"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (validationError) setValidationError(null);
          }}
          error={validationError ?? undefined}
          disabled={isSubmitting}
        />
        <Input
          label="타겟 독자"
          name="targetAudience"
          value={targetAudience}
          onChange={(event) => setTargetAudience(event.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label="언어"
          name="language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          disabled={isSubmitting}
        />
        <Input
          label="국가"
          name="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          disabled={isSubmitting}
        />
        <div className="md:col-span-2">
          <Input
            label="설명"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {editingProject && (
          <Select
            label="상태"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
            disabled={isSubmitting}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PROJECT_STATUS_LABELS[option]}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {editingProject ? "수정 저장" : "프로젝트 생성"}
        </Button>
        {editingProject && (
          <Button type="button" variant="secondary" onClick={onCancelEdit} disabled={isSubmitting}>
            수정 취소
          </Button>
        )}
      </div>
    </form>
  );
}
