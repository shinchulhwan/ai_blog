const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const MAX_PHOTO_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function getExtensionFromFilename(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

export function resolveMimeType(filename: string, reportedMime?: string): string | null {
  const ext = getExtensionFromFilename(filename);
  const mimeFromExt = MIME_BY_EXT[ext];

  if (reportedMime && ALLOWED_MIME_TYPES.has(reportedMime)) {
    if (mimeFromExt && mimeFromExt !== reportedMime) {
      return mimeFromExt;
    }
    return reportedMime;
  }

  return mimeFromExt ?? null;
}

export function isAllowedPhotoFile(filename: string, mimeType?: string): boolean {
  const resolved = resolveMimeType(filename, mimeType);
  return resolved !== null && ALLOWED_MIME_TYPES.has(resolved);
}

export function extensionForMime(mimeType: string): string {
  return EXT_BY_MIME[mimeType] ?? "jpg";
}

export function generateStoredName(
  projectId: string,
  sequence: number,
  mimeType: string,
): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const projectSuffix = projectId.slice(-6);
  const seq = String(sequence).padStart(3, "0");
  const ext = extensionForMime(mimeType);
  return `${date}-${projectSuffix}-${seq}.${ext}`;
}
