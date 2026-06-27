const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function isAllowedImageFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (ALLOWED_EXTENSIONS.has(ext)) return true;
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

async function readAllEntries(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File | null>((resolve) => {
      fileEntry.file(resolve, () => resolve(null));
    });
    return file && isAllowedImageFile(file) ? [file] : [];
  }

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
      const reader = dirEntry.createReader();
      const collected: FileSystemEntry[] = [];

      const readBatch = () => {
        reader.readEntries((batch) => {
          if (batch.length === 0) {
            resolve(collected);
            return;
          }
          collected.push(...batch);
          readBatch();
        }, () => resolve(collected));
      };

      readBatch();
    });

    const nested = await Promise.all(entries.map(readAllEntries));
    return nested.flat();
  }

  return [];
}

export async function collectFilesFromDataTransfer(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  const items = dataTransfer.items;

  if (items && items.length > 0) {
    const entries = Array.from(items)
      .map((item) => item.webkitGetAsEntry?.())
      .filter((entry): entry is FileSystemEntry => entry !== null && entry !== undefined);

    if (entries.length > 0) {
      const nested = await Promise.all(entries.map(readAllEntries));
      return nested.flat();
    }
  }

  return Array.from(dataTransfer.files).filter(isAllowedImageFile);
}

export function collectFilesFromFileList(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter(isAllowedImageFile);
}
