import { mkdir, writeFile, unlink, readFile, access } from "node:fs/promises";
import path from "node:path";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads", "projects");

export class PhotoStorageService {
  getProjectPhotoDir(projectId: string): string {
    return path.join(UPLOAD_ROOT, projectId, "photos");
  }

  resolveAbsolutePath(storagePath: string): string {
    return path.join(process.cwd(), storagePath);
  }

  async ensureProjectPhotoDir(projectId: string): Promise<string> {
    const dir = this.getProjectPhotoDir(projectId);
    await mkdir(dir, { recursive: true });
    return dir;
  }

  buildStoragePath(projectId: string, storedName: string): string {
    return path.join("data", "uploads", "projects", projectId, "photos", storedName);
  }

  async saveFile(
    projectId: string,
    storedName: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = await this.ensureProjectPhotoDir(projectId);
    const absolutePath = path.join(dir, storedName);
    await writeFile(absolutePath, buffer);
    return this.buildStoragePath(projectId, storedName);
  }

  async readFile(storagePath: string): Promise<Buffer> {
    const absolutePath = this.resolveAbsolutePath(storagePath);
    return readFile(absolutePath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const absolutePath = this.resolveAbsolutePath(storagePath);

    try {
      await access(absolutePath);
      await unlink(absolutePath);
    } catch {
      // File may already be removed; ignore.
    }
  }
}

export const photoStorageService = new PhotoStorageService();
