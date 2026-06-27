export interface PhotoAssetRecord {
  id: string;
  libraryId: string;
  projectId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoLibraryRecord {
  id: string;
  projectId: string;
  name: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoLibraryWithPhotos {
  library: PhotoLibraryRecord;
  photos: PhotoAssetRecord[];
}

export interface ReorderPhotosInput {
  photoIds: string[];
}
