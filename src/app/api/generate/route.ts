import { NextResponse } from "next/server";
import { createJobSchema } from "@/lib/schemas/job.schema";
import { parseWritingStyle } from "@/lib/prompts/writing-styles";
import { jobService, runGenerationJob } from "@/modules/workflow";

export const runtime = "nodejs";
export const maxDuration = 300;

/** @deprecated Job API(/api/jobs) 사용 권장 — 하위 호환용 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = createJobSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: "OPENAI API 키가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  try {
    const job = await jobService.create(parsed.data.keyword, {
      projectId: parsed.data.projectId,
    });
    const writingStyle = parseWritingStyle(parsed.data.writingStyle);
    const result = await runGenerationJob(job.id, { writingStyle });

    return NextResponse.json({
      success: true,
      result: result.result,
      historyId: result.historyId,
      jobId: result.jobId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "블로그 글 생성에 실패했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
