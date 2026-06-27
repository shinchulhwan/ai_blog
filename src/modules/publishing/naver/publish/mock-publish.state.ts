export interface MockPublishRecord {
  historyId: string;
  publishedUrl: string;
  publishedAt: Date;
  naverPostId: string;
}

const mockPublishRecords = new Map<string, MockPublishRecord>();

export function saveMockPublishRecord(record: MockPublishRecord): void {
  mockPublishRecords.set(record.historyId, record);
}

export function getMockPublishRecord(historyId: string): MockPublishRecord | null {
  return mockPublishRecords.get(historyId) ?? null;
}

export function clearMockPublishRecord(historyId: string): void {
  mockPublishRecords.delete(historyId);
}
