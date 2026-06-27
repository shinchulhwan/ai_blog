import { NotImplementedError } from "@/lib/errors";
import type { Publisher } from "../types";
import type { PublishPlatform } from "../types/publish-platform.types";
import { NaverPublisher } from "../naver/naver.publisher";
import { TistoryPublisher } from "../providers/tistory/tistory.publisher";
import { WordPressPublisher } from "../providers/wordpress/wordpress.publisher";

export function createPublisher(platform: PublishPlatform): Publisher {
  switch (platform) {
    case "naver":
      return new NaverPublisher();
    case "tistory":
      return new TistoryPublisher();
    case "wordpress":
      return new WordPressPublisher();
    default:
      throw new NotImplementedError(`Publisher: ${String(platform)}`);
  }
}

export function getAvailablePublishers(): PublishPlatform[] {
  return ["naver", "tistory", "wordpress"];
}
