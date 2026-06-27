import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import {
  createScheduleSchema,
  scheduleListQuerySchema,
} from "@/lib/schemas/schedule.schema";
import { scheduleService } from "@/modules/scheduler";

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode },
    );
  }

  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = scheduleListQuerySchema.safeParse({
      projectId: searchParams.get("projectId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      keyword: searchParams.get("keyword") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join("; ");
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const schedules = await scheduleService.list(parsed.data);
    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    return errorResponse(error, "예약 목록을 불러오지 못했습니다.");
  }
}

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

  const parsed = createScheduleSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const schedule = await scheduleService.create(parsed.data);
    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "예약을 생성하지 못했습니다.");
  }
}
