import { NextResponse } from "next/server";
import { blogHistoryService } from "@/modules/history";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const history = await blogHistoryService.getById(id);

    if (!history) {
      return NextResponse.json(
        { success: false, error: "생성 이력을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "생성 이력을 불러오지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const existing = await blogHistoryService.getById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "생성 이력을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    await blogHistoryService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "생성 이력을 삭제하지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
