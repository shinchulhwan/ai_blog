import { NextResponse } from "next/server";
import OpenAI from "openai";
import { blogHistoryService } from "@/modules/history";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const history = await blogHistoryService.regenerate(id);

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    const message =
      error instanceof OpenAI.APIError
        ? error.message
        : error instanceof Error
          ? error.message
          : "블로그 글 재생성에 실패했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
