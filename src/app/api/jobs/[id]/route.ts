import { NextResponse } from "next/server";
import { jobService } from "@/modules/workflow";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const job = await jobService.getById(id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "생성 작업을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "생성 작업을 불러오지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
