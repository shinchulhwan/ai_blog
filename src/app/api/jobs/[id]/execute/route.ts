import { NextResponse } from "next/server";
import { getKoreanErrorMessage } from "@/lib/errors";
import { executeJobSchema } from "@/lib/schemas/job.schema";
import { parseWritingStyle } from "@/lib/prompts/writing-styles";
import { jobService, runGenerationJob } from "@/modules/workflow";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const existing = await jobService.getById(id);

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "생성 작업을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  let writingStyle = parseWritingStyle(undefined);

  try {
    const body: unknown = await request.json().catch(() => null);

    if (body !== null) {
      const parsed = executeJobSchema.safeParse(body);

      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join("; ");
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }

      writingStyle = parseWritingStyle(parsed.data.writingStyle);
    }
  } catch {
    // Empty body is allowed — default style applies.
  }

  try {
    const result = await runGenerationJob(id, { writingStyle });

    return NextResponse.json({
      success: true,
      data: {
        jobId: result.jobId,
        historyId: result.historyId,
        result: result.result,
        publishUrl: result.publishUrl?.trim() || null,
        writingStyle,
      },
    });
  } catch (error) {
    const message = getKoreanErrorMessage(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
