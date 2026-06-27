import type { PhotoAsset, PhotoLibrary } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { normalizeServiceError } from "@/lib/errors/normalize-error";
import { projectService } from "@/modules/project";
import type {
  PhotoAssetRecord,
  PhotoLibraryRecord,
  PhotoLibraryWithPhotos,
} from "@/types/photo";
import { PhotoInvalidFileError, PhotoNotFoundError } from "../errors/photo.errors";
import {
  generateStoredName,
  isAllowedPhotoFile,
  MAX_PHOTO_FILE_SIZE_BYTES,
  resolveMimeType,
} from "../utils/photo-file.utils";
import { photoStorageService } from "./photo-storage.service";

function toPhotoAssetRecord(record: PhotoAsset): PhotoAssetRecord {
  return {
    id: record.id,
    libraryId: record.libraryId,
    projectId: record.projectId,
    originalName: record.originalName,
    storedName: record.storedName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    sortOrder: record.sortOrder,
    url: `/api/projects/${record.projectId}/photos/${record.id}/file`,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPhotoLibraryRecord(
  record: PhotoLibrary,
  photoCount: number,
): PhotoLibraryRecord {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    photoCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

interface UploadFileInput {
  name: string;
  mimeType?: string;
  buffer: Buffer;
}

export class PhotoLibraryService {
  async getOrCreateLibrary(projectId: string): Promise<PhotoLibrary> {
    await projectService.requireById(projectId);

    const existing = await prisma.photoLibrary.findUnique({
      where: { projectId },
    });

    if (existing) {
      return existing;
    }

    return prisma.photoLibrary.create({
      data: { projectId },
    });
  }

  async getLibraryWithPhotos(projectId: string): Promise<PhotoLibraryWithPhotos> {
    await projectService.requireById(projectId);

    const library = await this.getOrCreateLibrary(projectId);

    const photos = await prisma.photoAsset.findMany({
      where: { libraryId: library.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return {
      library: toPhotoLibraryRecord(library, photos.length),
      photos: photos.map(toPhotoAssetRecord),
    };
  }

  async uploadPhotos(
    projectId: string,
    files: UploadFileInput[],
  ): Promise<PhotoAssetRecord[]> {
    if (files.length === 0) {
      throw new PhotoInvalidFileError("업로드할 이미지를 선택해 주세요.");
    }

    await projectService.requireById(projectId);
    const library = await this.getOrCreateLibrary(projectId);

    const maxSort = await prisma.photoAsset.aggregate({
      where: { libraryId: library.id },
      _max: { sortOrder: true },
    });

    let nextSort = (maxSort._max.sortOrder ?? -1) + 1;
    let nextSequence = await prisma.photoAsset.count({
      where: { libraryId: library.id },
    });

    const created: PhotoAssetRecord[] = [];

    for (const file of files) {
      const mimeType = resolveMimeType(file.name, file.mimeType);

      if (!mimeType || !isAllowedPhotoFile(file.name, mimeType)) {
        throw new PhotoInvalidFileError(
          `"${file.name}"은(는) 지원하지 않는 형식입니다. (jpg, png, webp만 가능)`,
        );
      }

      if (file.buffer.byteLength > MAX_PHOTO_FILE_SIZE_BYTES) {
        throw new PhotoInvalidFileError(
          `"${file.name}" 파일 크기가 10MB를 초과합니다.`,
        );
      }

      nextSequence += 1;
      const storedName = generateStoredName(projectId, nextSequence, mimeType);
      const storagePath = await photoStorageService.saveFile(
        projectId,
        storedName,
        file.buffer,
      );

      try {
        const record = await prisma.photoAsset.create({
          data: {
            libraryId: library.id,
            projectId,
            originalName: file.name,
            storedName,
            mimeType,
            fileSize: file.buffer.byteLength,
            sortOrder: nextSort,
            storagePath,
          },
        });

        nextSort += 1;
        created.push(toPhotoAssetRecord(record));
      } catch (error) {
        await photoStorageService.deleteFile(storagePath);
        throw normalizeServiceError(error);
      }
    }

    return created;
  }

  async deletePhoto(projectId: string, photoId: string): Promise<void> {
    const photo = await prisma.photoAsset.findFirst({
      where: { id: photoId, projectId },
    });

    if (!photo) {
      throw new PhotoNotFoundError(photoId);
    }

    await photoStorageService.deleteFile(photo.storagePath);

    try {
      await prisma.photoAsset.delete({ where: { id: photoId } });
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async reorderPhotos(
    projectId: string,
    photoIds: string[],
  ): Promise<PhotoAssetRecord[]> {
    await projectService.requireById(projectId);
    const library = await this.getOrCreateLibrary(projectId);

    const existing = await prisma.photoAsset.findMany({
      where: { libraryId: library.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    const existingIds = new Set(existing.map((photo) => photo.id));

    if (photoIds.length !== existing.length) {
      throw new PhotoInvalidFileError("정렬 대상 사진 목록이 올바르지 않습니다.");
    }

    for (const id of photoIds) {
      if (!existingIds.has(id)) {
        throw new PhotoNotFoundError(id);
      }
    }

    try {
      await prisma.$transaction(
        photoIds.map((id, index) =>
          prisma.photoAsset.update({
            where: { id },
            data: { sortOrder: index },
          }),
        ),
      );
    } catch (error) {
      throw normalizeServiceError(error);
    }

    const updated = await prisma.photoAsset.findMany({
      where: { libraryId: library.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return updated.map(toPhotoAssetRecord);
  }

  async getPhotoFile(projectId: string, photoId: string) {
    const photo = await prisma.photoAsset.findFirst({
      where: { id: photoId, projectId },
    });

    if (!photo) {
      throw new PhotoNotFoundError(photoId);
    }

    const buffer = await photoStorageService.readFile(photo.storagePath);

    return {
      buffer,
      mimeType: photo.mimeType,
      storedName: photo.storedName,
    };
  }
}

export const photoLibraryService = new PhotoLibraryService();
