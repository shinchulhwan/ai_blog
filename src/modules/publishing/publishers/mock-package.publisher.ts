import type {
  PublishPackage,
  PublishPackageResult,
} from "../types/publish-package.types";

export class MockPackagePublisher {
  async publish(
    publishPackage: PublishPackage,
    historyId: string,
  ): Promise<PublishPackageResult> {
    return {
      success: true,
      mock: true,
      historyId,
      package: {
        ...publishPackage,
        updatedAt: new Date().toISOString(),
      },
      message: "Mock Publisher — PublishPackage 생성 완료 (실제 발행 없음)",
    };
  }
}

export const mockPackagePublisher = new MockPackagePublisher();
