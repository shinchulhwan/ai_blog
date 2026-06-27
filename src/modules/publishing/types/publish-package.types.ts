export interface PublishPackageImages {
  coverPrompt: string;
  contentImages: string[];
  thumbnailText: string;
  altTexts: string[];
  fileNames: string[];
  coverImageUrl?: string | null;
  contentImageUrls?: string[];
  thumbnailUrl?: string | null;
}

export interface PublishPackageFaqItem {
  question: string;
  answer: string;
}

export interface PublishPackage {
  title: string;
  metaDescription: string;
  content: string;
  faq: PublishPackageFaqItem[];
  hashtags: string[];
  images: PublishPackageImages;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PublishPackageResult {
  success: boolean;
  mock: boolean;
  historyId: string;
  package: PublishPackage;
  message: string;
}

export interface PublishEngineValidateInput {
  keyword: string;
  projectId: string;
  hasResult: boolean;
  hasImageResult: boolean;
  writingBrainCompleted: boolean;
}
