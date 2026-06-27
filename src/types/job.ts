export type JobStatus =
  | "PENDING"
  | "GENERATING"
  | "GENERATING_IMAGES"
  | "COMPLETED"
  | "FAILED";

export type JobProgress = 0 | 20 | 40 | 60 | 80 | 100;

export interface GenerationJobRecord {
  id: string;
  keyword: string;
  status: JobStatus;
  progress: JobProgress;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  blogHistoryId: string | null;
  researchId: string | null;
  currentStepLabel: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  imageJobId: string | null;
  naverUploadJobId: string | null;
  scheduleId: string | null;
  projectId: string;
}

export interface JobProgressUpdate {
  status: JobStatus;
  progress: JobProgress;
  stepLabel?: string;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  PENDING: "대기",
  GENERATING: "생성중",
  GENERATING_IMAGES: "이미지 생성중",
  COMPLETED: "완료",
  FAILED: "실패",
};

export const JOB_PROGRESS_LABELS: Record<JobProgress, string> = {
  0: "🔍 키워드 분석 중...",
  20: "🧠 초안 작성 중...",
  40: "📝 AI 리뷰 중...",
  60: "📈 SEO 검사 중...",
  80: "✨ 사람처럼 수정 중...",
  100: "✅ 완료",
};

export const VALID_JOB_PROGRESS: JobProgress[] = [0, 20, 40, 60, 80, 100];
