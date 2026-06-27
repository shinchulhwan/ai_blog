import { PhotoManager } from "@/components/photo/PhotoManager";

export default function ImagesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Photo Manager
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          프로젝트별 Photo Library에 이미지를 업로드하고 관리합니다.
        </p>
      </header>

      <PhotoManager />
    </div>
  );
}
