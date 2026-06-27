import { NotImplementedError } from "@/lib/errors";
import type { NaverPublishAdapter } from "./naver-adapter.types";
import type {
  NaverAdapterPublishResult,
  NaverCredentials,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "../types/naver.types";

export class OpenApiNaverAdapter implements NaverPublishAdapter {
  readonly type = "open_api" as const;

  async login(credentials?: NaverCredentials): Promise<NaverLoginResult> {
    void credentials;
    throw new NotImplementedError("Naver Open API login");
  }

  async publish(payload: NaverPublishPayload): Promise<NaverAdapterPublishResult> {
    void payload;
    throw new NotImplementedError("Naver Open API publish");
  }

  async getPublishStatus(externalId: string): Promise<NaverPublishStatusResult> {
    void externalId;
    throw new NotImplementedError("Naver Open API publish status");
  }
}
