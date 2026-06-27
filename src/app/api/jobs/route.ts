import { NextResponse } from "next/server";
import { createJobSchema } from "@/lib/schemas/job.schema";
import { jobService } from "@/modules/workflow";

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

  try {
    const job = await jobService.create(parsed.data.keyword, {
      projectId: parsed.data.projectId,
    });

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "생성 작업을 시작하지 못했습니다.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
