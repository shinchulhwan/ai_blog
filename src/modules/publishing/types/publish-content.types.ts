import type { FaqItem } from "@/types/history";

export interface PublishImageAsset {
  prompt: string;
  url?: string | null;
  alt?: string;
  filename?: string;
}

export interface PublishImages {
  representative: PublishImageAsset;
  body: PublishImageAsset[];
  thumbnailText?: string;
  thumbnailUrl?: string | null;
}

/** @deprecated Use PublishImages.representative */
export interface PublishRepresentativeImage {
  prompt: string;
  url?: string | null;
}

export interface PublishContent {
  historyId: string;
  keyword: string;
  title: string;
  content: string;
  faq: FaqItem[];
  hashtags: string[];
  metaDescription: string;
  images: PublishImages;
  /** @deprecated Use images.representative */
  representativeImage?: PublishRepresentativeImage;
}
