/** Analytics module — 향후 생성·발행·SEO 지표 추적 확장용 */

export interface ContentAnalyticsEvent {
  type: "generation" | "publish" | "research";
  keyword: string;
  metadata?: Record<string, unknown>;
}

export class AnalyticsService {
  async track(event: ContentAnalyticsEvent): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      console.info("[analytics]", event.type, event.keyword);
    }
    void event;
  }
}

export const analyticsService = new AnalyticsService();
