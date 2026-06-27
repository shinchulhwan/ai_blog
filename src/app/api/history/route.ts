import { NextResponse } from "next/server";
import { blogHistoryListQuerySchema } from "@/lib/schemas/blog-history.schema";
import { blogHistoryService } from "@/modules/history";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = blogHistoryListQuerySchema.safeParse({
      projectId: searchParams.get("projectId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { search, status, limit, offset, projectId } = parsed.data;
    const histories = await blogHistoryService.list({
      search,
      status,
      limit,
      offset,
      projectId,
    });

    return NextResponse.json({ success: true, data: histories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "생성 이력을 불러오지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
