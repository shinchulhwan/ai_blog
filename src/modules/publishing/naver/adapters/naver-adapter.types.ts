import type {
  NaverAdapterPublishResult,
  NaverCredentials,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "../types/naver.types";

export interface NaverPublishAdapter {
  readonly type: import("../types/naver.types").NaverAdapterType;
  login(credentials?: NaverCredentials): Promise<NaverLoginResult>;
  publish(payload: NaverPublishPayload): Promise<NaverAdapterPublishResult>;
  getPublishStatus(externalId: string): Promise<NaverPublishStatusResult>;
}
