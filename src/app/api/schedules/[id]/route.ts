import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { updateScheduleSchema } from "@/lib/schemas/schedule.schema";
import { scheduleService } from "@/modules/scheduler";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const schedule = await scheduleService.getById(id);

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "예약을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const runs = await scheduleService.listRuns(id);

    return NextResponse.json({
      success: true,
      data: { schedule, runs },
    });
  } catch (error) {
    return errorResponse(error, "예약 정보를 불러오지 못했습니다.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = updateScheduleSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const schedule = await scheduleService.update(id, parsed.data);
    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    return errorResponse(error, "예약을 수정하지 못했습니다.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    await scheduleService.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "예약을 삭제하지 못했습니다.");
  }
}
