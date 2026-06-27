import { NextResponse } from "next/server";
import { getKoreanErrorMessage } from "@/lib/errors";
import { jobService, runGenerationJob } from "@/modules/workflow";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const existing = await jobService.getById(id);

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "생성 작업을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  try {
    const result = await runGenerationJob(id);

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        historyId: result.historyId,
        result: result.result,
      },
    });
  } catch (error) {
    const message = getKoreanErrorMessage(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
