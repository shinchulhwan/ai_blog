import type { NaverPublishAdapter } from "./naver-adapter.types";
import type {
  NaverAdapterPublishResult,
  NaverCredentials,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "../types/naver.types";

const mockSessions = new Map<string, { loggedInAt: Date }>();
const mockPosts = new Map<string, { url: string; publishedAt: Date }>();

export class MockNaverAdapter implements NaverPublishAdapter {
  readonly type = "mock" as const;

  async login(credentials?: NaverCredentials): Promise<NaverLoginResult> {
    void credentials;
    const sessionId = `mock-session-${Date.now()}`;
    mockSessions.set(sessionId, { loggedInAt: new Date() });

    return {
      success: true,
      sessionId,
      message: "Mock 네이버 로그인 성공",
      mock: true,
    };
  }

  async publish(payload: NaverPublishPayload): Promise<NaverAdapterPublishResult> {
    const externalId = `mock-naver-${payload.historyId}-${Date.now()}`;
    const url = `https://blog.naver.com/mock/${externalId}`;
    const publishedAt = new Date();

    mockPosts.set(externalId, { url, publishedAt });

    return {
      externalId,
      url,
      publishedAt,
      mock: true,
    };
  }

  async getPublishStatus(externalId: string): Promise<NaverPublishStatusResult> {
    const post = mockPosts.get(externalId);

    if (!post) {
      return {
        externalId,
        status: "failed",
        url: null,
        message: "Mock 발행 기록을 찾을 수 없습니다.",
        mock: true,
      };
    }

    return {
      externalId,
      status: "published",
      url: post.url,
      message: "Mock 발행 완료",
      mock: true,
    };
  }
}
